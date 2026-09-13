import type { IntakeEvent } from '../db/intakes';

interface ScheduleInput {
  courseId: string;
  pillsPerPack: number;
  dosePerDay: number;
  timesPerDay: number;
  startDate: Date;
  customTimes?: string[];
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

export function calculateCourse(input: ScheduleInput): ScheduleResult {
  const { courseId, pillsPerPack, dosePerDay, timesPerDay, startDate, customTimes } = input;

  const totalDoses = Math.floor(pillsPerPack / dosePerDay);
  const durationDays = Math.ceil(totalDoses / timesPerDay);
  const times = customTimes?.length === timesPerDay
    ? customTimes
    : DEFAULT_TIMES[timesPerDay] ?? ['08:00'];

  const events: Omit<IntakeEvent, 'id'>[] = [];

  for (let day = 0; day < durationDays; day++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + day);
    const dateStr = date.toISOString().split('T')[0];

    for (const time of times) {
      const scheduledAt = `${dateStr}T${time}:00.000`;
      events.push({
        course_id: courseId,
        scheduled_at: scheduledAt,
        status: 'pending',
        marked_at: null,
      });
    }
  }

  return { durationDays, intakeEvents: events };
}
