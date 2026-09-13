import { getDb } from './client';

export interface Medication {
  id: string;
  name: string;
  photo_uri: string | null;
  barcode: string | null;
  pills_per_pack: number;
}

export async function insertMedication(m: Medication): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO medications (id, name, photo_uri, barcode, pills_per_pack) VALUES (?, ?, ?, ?, ?)',
    [m.id, m.name, m.photo_uri ?? null, m.barcode ?? null, m.pills_per_pack],
  );
}

export async function getMedications(): Promise<Medication[]> {
  const db = await getDb();
  return db.getAllAsync<Medication>('SELECT * FROM medications ORDER BY name');
}

export async function getMedicationById(id: string): Promise<Medication | null> {
  const db = await getDb();
  return db.getFirstAsync<Medication>('SELECT * FROM medications WHERE id = ?', [id]);
}
