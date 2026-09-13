import * as SQLite from 'expo-sqlite';
import { ALL_TABLES } from './schema';

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync('pillytrack.db');
  await _db.execAsync(ALL_TABLES.join('\n'));
  return _db;
}
