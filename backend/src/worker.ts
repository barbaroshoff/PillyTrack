export interface Env {
  ANTHROPIC_API_KEY: string;
}

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
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
    try {
      const body = await request.json() as { imageBase64: string };
      imageBase64 = body.imageBase64;
      if (!imageBase64) throw new Error('missing imageBase64');
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

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
                text: `Это фото упаковки лекарства. Найди название препарата и предоставь информацию о нём.

Ответь СТРОГО в JSON (без markdown, только чистый JSON):
{
  "name": "точное название препарата с упаковки",
  "description": "краткое описание применения (2-3 предложения на русском)",
  "dosage": "стандартная дозировка для взрослых",
  "contraindications": "основные противопоказания (кратко)",
  "sideEffects": "основные побочные эффекты (кратко)",
  "pillsCount": число или null (количество таблеток/капсул в упаковке если видно на упаковке)
}

Если не можешь определить название препарата на фото, верни: {"error": "Не удалось распознать название препарата на фото"}`,
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
