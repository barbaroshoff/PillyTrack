import * as FileSystem from 'expo-file-system/legacy';

const API_URL = 'https://api.anthropic.com/v1/messages';

export interface MedicationInfo {
  name: string;
  description: string;
  dosage: string;
  contraindications: string;
  sideEffects: string;
  pillsCount: number | null;
}

export async function recognizeMedicationFromPhoto(
  photoUri: string,
  apiKey: string,
): Promise<MedicationInfo> {
  if (!apiKey) throw new Error('API ключ не настроен. Добавьте EXPO_PUBLIC_ANTHROPIC_API_KEY в файл .env');

  const base64 = await FileSystem.readAsStringAsync(photoUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
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
                data: base64,
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

  if (!response.ok) {
    const err = await response.text().catch(() => '');
    throw new Error(`Ошибка API (${response.status}): ${err}`);
  }

  const data = await response.json();
  const text: string = data.content?.[0]?.text ?? '';

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Не удалось разобрать ответ AI');

  const parsed = JSON.parse(jsonMatch[0]);
  if (parsed.error) throw new Error(parsed.error as string);

  return parsed as MedicationInfo;
}
