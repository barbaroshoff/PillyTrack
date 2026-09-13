import { getDb } from '../db/client';
import type { Medication } from '../db/medications';

export async function lookupBarcode(barcode: string): Promise<Medication | null> {
  const db = await getDb();
  return db.getFirstAsync<Medication>(
    'SELECT * FROM medications WHERE barcode = ?',
    [barcode],
  );
}
