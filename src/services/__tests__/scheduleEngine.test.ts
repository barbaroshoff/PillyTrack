import { calculateCourse } from '../scheduleEngine';

describe('calculateCourse', () => {
  const base = {
    courseId: 'test-course',
    startDate: new Date('2024-01-01T00:00:00.000Z'),
  };

  test('calculates correct duration for 30 pills, 1 per day, 1 time', () => {
    const result = calculateCourse({ ...base, pillsPerPack: 30, dosePerDay: 1, timesPerDay: 1 });
    expect(result.durationDays).toBe(30);
    expect(result.intakeEvents).toHaveLength(30);
  });

  test('calculates correct duration for 30 pills, 2 per day, 2 times', () => {
    const result = calculateCourse({ ...base, pillsPerPack: 30, dosePerDay: 1, timesPerDay: 2 });
    expect(result.durationDays).toBe(15);
    expect(result.intakeEvents).toHaveLength(30);
  });

  test('uses custom times when provided', () => {
    const result = calculateCourse({
      ...base,
      pillsPerPack: 10,
      dosePerDay: 1,
      timesPerDay: 2,
      customTimes: ['07:30', '19:30'],
    });
    const times = result.intakeEvents.map((e) => e.scheduled_at.slice(11, 16));
    expect(times).toContain('07:30');
    expect(times).toContain('19:30');
  });

  test('all events have status pending', () => {
    const result = calculateCourse({ ...base, pillsPerPack: 5, dosePerDay: 1, timesPerDay: 1 });
    expect(result.intakeEvents.every((e) => e.status === 'pending')).toBe(true);
  });

  test('events are on consecutive days', () => {
    const result = calculateCourse({ ...base, pillsPerPack: 3, dosePerDay: 1, timesPerDay: 1 });
    const dates = result.intakeEvents.map((e) => e.scheduled_at.slice(0, 10));
    expect(dates).toEqual(['2024-01-01', '2024-01-02', '2024-01-03']);
  });
});
