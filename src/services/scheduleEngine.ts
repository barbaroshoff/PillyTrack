import type { IntakeEvent } from '../db/intakes';

export type Frequency = 'daily' | 'every_other_day' | 'custom_days';

interface ScheduleInput {
  courseId: string;
  pillsPerPack: number;
  dosePerDay: number;
  timesPerDay: number;
  startDate: Date;
  customTimes?: string[];
  frequency?: Frequency;
  customDays?: number[]; // 0=Sun, 1=Mon … 6=Sat
}

interface ScheduleResult {
  durationDays: number;
  intakeEvents: Omit<IntakeEvent, 'id'>[];
}

const DEFAULT_TIMES: Record<number, string[]> = {
  1: ['08:00'],
  2: ['08:00', '20:00'],
  3: ['08:00', '14:00', '20:00'],
  4: ['08:00', '12:00', '16:00', '20:00'],
};

function makeEvent(courseId: string, dateStr: string, time: string): Omit<IntakeEvent, 'id'> {
  return {
    course_id: courseId,
    scheduled_at: `${dateStr}T${time}:00.000`,
    status: 'pending',
    marked_at: null,
  };
}

export function calculateCourse(input: ScheduleInput): ScheduleResult {
  const {
    courseId, pillsPerPack, dosePerDay, timesPerDay,
    startDate, customTimes, frequency = 'daily', customDays = [],
  } = input;

  const totalDoses = Math.floor(pillsPerPack / dosePerDay);
  const doseDaysNeeded = Math.ceil(totalDoses / timesPerDay);
  const times = customTimes?.length === timesPerDay
    ? customTimes
    : DEFAULT_TIMES[timesPerDay] ?? ['08:00'];

  const events: Omit<IntakeEvent, 'id'>[] = [];

  if (frequency === 'every_other_day') {
    for (let i = 0; i < doseDaysNeeded; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i * 2);
      const dateStr = date.toISOString().split('T')[0];
      for (const time of times) events.push(makeEvent(courseId, dateStr, time));
    }
    const durationDays = doseDaysNeeded > 0 ? (doseDaysNeeded - 1) * 2 + 1 : 0;
    return { durationDays, intakeEvents: events };
  }

  if (frequency === 'custom_days' && customDays.length > 0) {
    let filled = 0;
    let calDay = 0;
    while (filled < doseDaysNeeded) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + calDay);
      if (customDays.includes(date.getDay())) {
        const dateStr = date.toISOString().split('T')[0];
        for (const time of times) events.push(makeEvent(courseId, dateStr, time));
        filled++;
      }
      calDay++;
    }
    return { durationDays: calDay, intakeEvents: events };
  }

  // daily (default)
  for (let day = 0; day < doseDaysNeeded; day++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + day);
    const dateStr = date.toISOString().split('T')[0];
    for (const time of times) events.push(makeEvent(courseId, dateStr, time));
  }
  return { durationDays: doseDaysNeeded, intakeEvents: events };
}
