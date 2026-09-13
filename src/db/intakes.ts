import { getDb } from './client';

export type IntakeStatus = 'pending' | 'taken' | 'missed';

export interface IntakeEvent {
  id: string;
  course_id: string;
  scheduled_at: string;
  status: IntakeStatus;
  marked_at: string | null;
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
  const dayStart = dateIso + 'T00:00:00.000Z';
  const dayEnd = dateIso + 'T23:59:59.999Z';
  return db.getAllAsync<IntakeEvent>(
    `SELECT * FROM intake_events WHERE scheduled_at >= ? AND scheduled_at <= ? ORDER BY scheduled_at`,
    [dayStart, dayEnd],
  );
}

export async function markIntakeEvent(id: string, status: IntakeStatus): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE intake_events SET status = ?, marked_at = ? WHERE id = ?',
    [status, new Date().toISOString(), id],
  );
}
