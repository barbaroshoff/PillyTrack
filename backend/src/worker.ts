export interface Env {
  ANTHROPIC_API_KEY: string;
  SHARES: KVNamespace;
}

// Общий доступ к курсам по коду ("Premium" фича — шарит владелец, смотрит кто угодно с кодом)
const SHARE_TTL_SECONDS = 60 * 60 * 24 * 60; // 60 дней с момента последней синхронизации
const CODE_PATTERN = /^[A-Z0-9-]{4,40}$/;

interface ShareRecord {
  ownerToken: string;
  data: unknown;
  updatedAt: number;
}

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

const LANGUAGE_NAMES: Record<string, string> = {
  ru: 'Russian',
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pl: 'Polish',
  uk: 'Ukrainian',
  pt: 'Portuguese',
  nl: 'Dutch',
  tr: 'Turkish',
  ro: 'Romanian',
  el: 'Greek',
  cs: 'Czech',
  sv: 'Swedish',
  hu: 'Hungarian',
  bg: 'Bulgarian',
  da: 'Danish',
  fi: 'Finnish',
  sk: 'Slovak',
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

async function handleShare(request: Request, env: Env, code: string): Promise<Response> {
  const normalized = code.toUpperCase();
  if (!CODE_PATTERN.test(normalized)) {
    return json({ error: 'Invalid code' }, 400);
  }
  const key = `share:${normalized}`;

  if (request.method === 'GET') {
    const raw = await env.SHARES.get(key);
    if (!raw) return json({ error: 'Code not found' }, 404);
    const record = JSON.parse(raw) as ShareRecord;
    return json({ data: record.data, updatedAt: record.updatedAt });
  }

  if (request.method === 'PUT') {
    let body: { ownerToken?: string; data?: unknown };
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid request body' }, 400);
    }
    const ownerToken = body.ownerToken;
    if (!ownerToken || typeof ownerToken !== 'string' || ownerToken.length < 16) {
      return json({ error: 'Invalid ownerToken' }, 400);
    }
    if (body.data === undefined) {
      return json({ error: 'Missing data' }, 400);
    }

    const existingRaw = await env.SHARES.get(key);
    if (existingRaw) {
      const existing = JSON.parse(existingRaw) as ShareRecord;
      if (existing.ownerToken !== ownerToken) {
        return json({ error: 'Code already in use' }, 409);
      }
    }

    const record: ShareRecord = { ownerToken, data: body.data, updatedAt: Date.now() };
    await env.SHARES.put(key, JSON.stringify(record), { expirationTtl: SHARE_TTL_SECONDS });
    return json({ ok: true, updatedAt: record.updatedAt });
  }

  if (request.method === 'DELETE') {
    let body: { ownerToken?: string };
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid request body' }, 400);
    }
    const existingRaw = await env.SHARES.get(key);
    if (!existingRaw) return json({ ok: true });
    const existing = JSON.parse(existingRaw) as ShareRecord;
    if (existing.ownerToken !== body.ownerToken) {
      return json({ error: 'Forbidden' }, 403);
    }
    await env.SHARES.delete(key);
    return json({ ok: true });
  }

  return json({ error: 'Method not allowed' }, 405);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const shareMatch = url.pathname.match(/^\/share\/([^/]+)$/);
    if (shareMatch) {
      return handleShare(request, env, decodeURIComponent(shareMatch[1]));
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS });
    }

    if (!env.ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    let imageBase64: string;
    let lang: string;
    try {
      const body = await request.json() as { imageBase64: string; lang?: string };
      imageBase64 = body.imageBase64;
      if (!imageBase64) throw new Error('missing imageBase64');
      lang = body.lang ?? 'en';
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const languageName = LANGUAGE_NAMES[lang] ?? 'English';

    const anthropicResponse = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: imageBase64,
                },
              },
              {
                type: 'text',
                text: `This is a photo of a medication package. Identify the medication name and provide information about it.

Respond STRICTLY in JSON (no markdown, pure JSON only). Write every text value in ${languageName}:
{
  "name": "exact medication name from the package (keep the original product name as printed, do not translate it)",
  "description": "brief description of its use (2-3 sentences, in ${languageName})",
  "dosage": "standard adult dosage, in ${languageName}",
  "contraindications": "main contraindications (briefly, in ${languageName})",
  "sideEffects": "main side effects (briefly, in ${languageName})",
  "pillsCount": number or null (number of pills/capsules in the package if visible)
}

If you cannot identify the medication name in the photo, return: {"error": "<a short message in ${languageName} saying the medication name could not be recognized in the photo>"}`,
              },
            ],
          },
        ],
      }),
    });

    if (!anthropicResponse.ok) {
      const err = await anthropicResponse.text().catch(() => '');
      return new Response(JSON.stringify({ error: `Anthropic error (${anthropicResponse.status}): ${err}` }), {
        status: 502,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const data = await anthropicResponse.json() as { content: { text: string }[] };
    const text = data.content?.[0]?.text ?? '';

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(JSON.stringify({ error: 'Failed to parse AI response' }), {
        status: 502,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    return new Response(jsonMatch[0], {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  },
};
