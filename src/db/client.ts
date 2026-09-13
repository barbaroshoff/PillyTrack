import * as SQLite from 'expo-sqlite';
import { ALL_TABLES } from './schema';

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync('pillytrack.db');
  await _db.execAsync(ALL_TABLES.join('\n'));
  // migrations — ignore errors if columns already exist
  await _db.execAsync(`ALTER TABLE courses ADD COLUMN frequency TEXT NOT NULL DEFAULT 'daily'`).catch(() => {});
  await _db.execAsync(`ALTER TABLE courses ADD COLUMN custom_days TEXT NOT NULL DEFAULT '[]'`).catch(() => {});
  return _db;
}
