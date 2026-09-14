import * as FileSystem from 'expo-file-system/legacy';

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
  proxyUrl: string,
  lang: string,
): Promise<MedicationInfo> {
  if (!proxyUrl) throw new Error('Сервер не настроен. Добавьте EXPO_PUBLIC_PROXY_URL в файл .env');

  const base64 = await FileSystem.readAsStringAsync(photoUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const response = await fetch(`${proxyUrl}/recognize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64: base64, lang }),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => '');
    throw new Error(`Ошибка сервера (${response.status}): ${err}`);
  }

  const parsed = await response.json() as MedicationInfo & { error?: string };
  if (parsed.error) throw new Error(parsed.error);

  return parsed;
}
