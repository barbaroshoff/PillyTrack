export const CREATE_MEDICATIONS = `
  CREATE TABLE IF NOT EXISTS medications (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    photo_uri TEXT,
    barcode TEXT,
    pills_per_pack INTEGER NOT NULL DEFAULT 0
  );
`;

export const CREATE_COURSES = `
  CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    medication_id TEXT NOT NULL,
    times_per_day INTEGER NOT NULL DEFAULT 1,
    custom_times TEXT NOT NULL DEFAULT '[]',
    start_date TEXT NOT NULL,
    duration_days INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    FOREIGN KEY (medication_id) REFERENCES medications(id)
  );
`;

export const CREATE_INTAKE_EVENTS = `
  CREATE TABLE IF NOT EXISTS intake_events (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    scheduled_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    marked_at TEXT,
    FOREIGN KEY (course_id) REFERENCES courses(id)
  );
`;

export const ALL_TABLES = [CREATE_MEDICATIONS, CREATE_COURSES, CREATE_INTAKE_EVENTS];
