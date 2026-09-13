import { getDb } from './client';

export type IntakeStatus = 'pending' | 'taken' | 'missed';

export interface IntakeEvent {
  id: string;
  course_id: string;
  scheduled_at: string;
  status: IntakeStatus;
  marked_at: string | null;
  medication_name?: string;
}

export async function insertIntakeEvents(events: IntakeEvent[]): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (const e of events) {
      await db.runAsync(
        'INSERT INTO intake_events (id, course_id, scheduled_at, status, marked_at) VALUES (?, ?, ?, ?, ?)',
        [e.id, e.course_id, e.scheduled_at, e.status, e.marked_at ?? null],
      );
    }
  });
}

export async function getIntakesForDate(dateIso: string): Promise<IntakeEvent[]> {
  const db = await getDb();
  return db.getAllAsync<IntakeEvent>(
    `SELECT ie.*, m.name as medication_name
     FROM intake_events ie
     JOIN courses c ON ie.course_id = c.id
     JOIN medications m ON c.medication_id = m.id
     WHERE ie.scheduled_at LIKE ?
     ORDER BY ie.scheduled_at`,
    [`${dateIso}%`],
  );
}

export async function markIntakeEvent(id: string, status: IntakeStatus): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE intake_events SET status = ?, marked_at = ? WHERE id = ?',
    [status, new Date().toISOString(), id],
  );
}

export interface IntakeStats {
  total: number;
  taken: number;
  missed: number;
}

export async function getIntakeStatsByCourse(courseId: string): Promise<IntakeStats> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ status: IntakeStatus; cnt: number }>(
    `SELECT status, COUNT(*) as cnt FROM intake_events WHERE course_id = ? GROUP BY status`,
    [courseId],
  );
  const map = Object.fromEntries(rows.map((r) => [r.status, r.cnt]));
  return {
    total: rows.reduce((s, r) => s + r.cnt, 0),
    taken: map['taken'] ?? 0,
    missed: map['missed'] ?? 0,
  };
}

export async function getIntakesForMonth(yearMonth: string): Promise<IntakeEvent[]> {
  const db = await getDb();
  return db.getAllAsync<IntakeEvent>(
    `SELECT * FROM intake_events WHERE scheduled_at LIKE ? ORDER BY scheduled_at`,
    [`${yearMonth}%`],
  );
}

export async function getPendingIntakes(): Promise<IntakeEvent[]> {
  const db = await getDb();
  return db.getAllAsync<IntakeEvent>(
    `SELECT * FROM intake_events WHERE status = 'pending' ORDER BY scheduled_at`,
  );
}

export async function getRecentIntakesByCourse(courseId: string, limit = 5): Promise<IntakeEvent[]> {
  const db = await getDb();
  return db.getAllAsync<IntakeEvent>(
    `SELECT * FROM intake_events WHERE course_id = ? ORDER BY scheduled_at DESC LIMIT ?`,
    [courseId, limit],
  );
}
