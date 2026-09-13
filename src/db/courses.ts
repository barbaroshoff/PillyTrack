import { getDb } from './client';
import type { Frequency } from '../services/scheduleEngine';

export type { Frequency };

export interface Course {
  id: string;
  medication_id: string;
  times_per_day: number;
  custom_times: string[];
  frequency: Frequency;
  custom_days: number[];
  start_date: string;
  duration_days: number;
  status: 'active' | 'completed' | 'paused';
}

function parseRow(r: Omit<Course, 'custom_times' | 'custom_days'> & { custom_times: string; custom_days?: string }): Course {
  return {
    ...r,
    custom_times: JSON.parse(r.custom_times),
    custom_days: JSON.parse(r.custom_days ?? '[]'),
    frequency: (r.frequency ?? 'daily') as Frequency,
  };
}

export async function insertCourse(c: Course): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO courses (id, medication_id, times_per_day, custom_times, frequency, custom_days, start_date, duration_days, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [c.id, c.medication_id, c.times_per_day, JSON.stringify(c.custom_times),
     c.frequency, JSON.stringify(c.custom_days), c.start_date, c.duration_days, c.status],
  );
}

export async function getActiveCourses(): Promise<Course[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(`SELECT * FROM courses WHERE status = 'active'`);
  return rows.map(parseRow);
}

export async function updateCourseStatus(id: string, status: Course['status']): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE courses SET status = ? WHERE id = ?', [status, id]);
}

export async function getCourseByMedicationId(medicationId: string): Promise<Course | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<any>(
    `SELECT * FROM courses WHERE medication_id = ? AND status = 'active' ORDER BY start_date DESC LIMIT 1`,
    [medicationId],
  );
  return row ? parseRow(row) : null;
}

export interface CourseWithMedication extends Course {
  medication_name: string;
  photo_uri: string | null;
  next_intake_at: string | null;
}

export async function getActiveCoursesWithMedications(): Promise<CourseWithMedication[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    `SELECT c.*, m.name as medication_name, m.photo_uri,
       (SELECT scheduled_at FROM intake_events
        WHERE course_id = c.id AND status = 'pending'
        ORDER BY scheduled_at ASC LIMIT 1) as next_intake_at
     FROM courses c
     JOIN medications m ON c.medication_id = m.id
     WHERE c.status = 'active'
     ORDER BY CASE WHEN next_intake_at IS NULL THEN 1 ELSE 0 END, next_intake_at ASC`,
  );
  return rows.map(parseRow) as CourseWithMedication[];
}

export async function completeCourseIfDone(courseId: string): Promise<void> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ cnt: number }>(
    `SELECT COUNT(*) as cnt FROM intake_events WHERE course_id = ? AND status = 'pending'`,
    [courseId],
  );
  if (row && row.cnt === 0) {
    await db.runAsync(`UPDATE courses SET status = 'completed' WHERE id = ?`, [courseId]);
  }
}

export async function getActiveCoursesCount(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ cnt: number }>(
    "SELECT COUNT(*) as cnt FROM courses WHERE status = 'active'",
  );
  return row?.cnt ?? 0;
}

export async function getCourseById(id: string): Promise<Course | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<any>('SELECT * FROM courses WHERE id = ?', [id]);
  return row ? parseRow(row) : null;
}
