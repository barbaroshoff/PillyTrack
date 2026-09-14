import { PROXY_URL } from '../config';
import { getActiveCoursesWithMedications } from '../db/courses';
import { getIntakeStatsByCourse, getRecentIntakesByCourse } from '../db/intakes';
import type { IntakeStatus } from '../db/intakes';
import type { Frequency } from '../services/scheduleEngine';
import { getShareIdentity, regenerateShareIdentity, markSynced } from './shareIdentity';
import type { ShareIdentity } from './shareIdentity';

export interface SharedIntake {
  scheduledAt: string;
  status: IntakeStatus;
}

export interface SharedCourse {
  medicationName: string;
  timesPerDay: number;
  durationDays: number;
  frequency: Frequency;
  startDate: string;
  stats: { taken: number; missed: number; total: number };
  recentIntakes: SharedIntake[];
}

export interface ShareSnapshot {
  generatedAt: number;
  courses: SharedCourse[];
}

async function buildSnapshot(): Promise<ShareSnapshot> {
  const courses = await getActiveCoursesWithMedications();
  const items: SharedCourse[] = [];
  for (const c of courses) {
    const [stats, recent] = await Promise.all([
      getIntakeStatsByCourse(c.id),
      getRecentIntakesByCourse(c.id, 20),
    ]);
    items.push({
      medicationName: c.medication_name,
      timesPerDay: c.times_per_day,
      durationDays: c.duration_days,
      frequency: c.frequency,
      startDate: c.start_date,
      stats,
      recentIntakes: recent.map((e) => ({ scheduledAt: e.scheduled_at, status: e.status })),
    });
  }
  return { generatedAt: Date.now(), courses: items };
}

async function putShare(identity: ShareIdentity, data: ShareSnapshot): Promise<Response> {
  return fetch(`${PROXY_URL}/share/${identity.code}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ownerToken: identity.ownerToken, data }),
  });
}

export async function getCurrentShareIdentity(): Promise<ShareIdentity> {
  return getShareIdentity();
}

export async function regenerateCode(): Promise<ShareIdentity> {
  const old = await getShareIdentity();
  fetch(`${PROXY_URL}/share/${old.code}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ownerToken: old.ownerToken }),
  }).catch(() => {});
  return regenerateShareIdentity();
}

export async function syncShare(): Promise<ShareIdentity> {
  if (!PROXY_URL) throw new Error('Сервер не настроен');
  let identity = await getShareIdentity();
  const data = await buildSnapshot();

  let res = await putShare(identity, data);
  if (res.status === 409) {
    // Код уже занят кем-то другим (крайне маловероятно) — сгенерировать новый и повторить один раз
    identity = await regenerateShareIdentity();
    res = await putShare(identity, data);
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({} as { error?: string }));
    throw new Error(err.error ?? `Ошибка сервера (${res.status})`);
  }
  const json = (await res.json()) as { updatedAt: number };
  return markSynced(json.updatedAt);
}

export async function revokeShare(): Promise<void> {
  const identity = await getShareIdentity();
  await fetch(`${PROXY_URL}/share/${identity.code}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ownerToken: identity.ownerToken }),
  }).catch(() => {});
}

export async function fetchSharedData(code: string): Promise<ShareSnapshot> {
  if (!PROXY_URL) throw new Error('Сервер не настроен');
  const normalized = code.trim().toUpperCase();
  const res = await fetch(`${PROXY_URL}/share/${encodeURIComponent(normalized)}`);
  if (res.status === 404) throw new Error('CODE_NOT_FOUND');
  if (!res.ok) throw new Error(`Ошибка сервера (${res.status})`);
  const json = (await res.json()) as { data: ShareSnapshot };
  return json.data;
}
