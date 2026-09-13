import { getDb } from './client';

export interface Course {
  id: string;
  medication_id: string;
  times_per_day: number;
  custom_times: string[];
  start_date: string;
  duration_days: number;
  status: 'active' | 'completed' | 'paused';
}

export async function insertCourse(c: Course): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO courses (id, medication_id, times_per_day, custom_times, start_date, duration_days, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [c.id, c.medication_id, c.times_per_day, JSON.stringify(c.custom_times), c.start_date, c.duration_days, c.status],
  );
}

export async function getActiveCourses(): Promise<Course[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Omit<Course, 'custom_times'> & { custom_times: string }>(
    `SELECT * FROM courses WHERE status = 'active'`,
  );
  return rows.map((r) => ({ ...r, custom_times: JSON.parse(r.custom_times) }));
}

export async function updateCourseStatus(id: string, status: Course['status']): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE courses SET status = ? WHERE id = ?', [status, id]);
}
