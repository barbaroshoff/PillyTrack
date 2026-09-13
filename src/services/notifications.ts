import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import type { IntakeEvent } from '../db/intakes';
import { markIntakeEvent } from '../db/intakes';
import { getDb } from '../db/client';

const CATEGORY_ID = 'intake_reminder';
const MAX_MAIN_EVENTS = 40;
const REMINDER_HORIZON_HOURS = 48;
const REMINDER_INTERVALS_MIN = [20, 40]; // повторы через 20 и 40 мин

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function setupNotificationCategories(): Promise<void> {
  await Notifications.setNotificationCategoryAsync(CATEGORY_ID, [
    { identifier: 'taken', buttonTitle: 'Да, принял', options: { isDestructive: false } },
    { identifier: 'missed', buttonTitle: 'Пропустить', options: { isDestructive: true } },
  ]);
}

export async function cancelIntakeNotifications(intakeId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(intakeId);
  for (const mins of REMINDER_INTERVALS_MIN) {
    await Notifications.cancelScheduledNotificationAsync(`${intakeId}_r${mins}`);
  }
}

export async function scheduleIntakeNotifications(
  medicationName: string,
  events: IntakeEvent[],
): Promise<void> {
  const granted = await requestNotificationPermissions();
  if (!granted) return;

  const now = Date.now();
  const reminderHorizonMs = REMINDER_HORIZON_HOURS * 60 * 60 * 1000;

  const toSchedule = events
    .filter((e) => new Date(e.scheduled_at).getTime() > now)
    .slice(0, MAX_MAIN_EVENTS);

  for (const ev of toSchedule) {
    const triggerMs = new Date(ev.scheduled_at).getTime();

    // Основное уведомление
    await Notifications.scheduleNotificationAsync({
      identifier: ev.id,
      content: {
        title: `💊 Время принять ${medicationName}`,
        body: 'Нажмите «Принял» чтобы отметить приём',
        data: { intakeId: ev.id },
        categoryIdentifier: CATEGORY_ID,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(triggerMs),
      },
    });

    // Повторные напоминания — только для событий в ближайшие 48 часов
    if (triggerMs < now + reminderHorizonMs) {
      for (const mins of REMINDER_INTERVALS_MIN) {
        const reminderMs = triggerMs + mins * 60 * 1000;
        if (reminderMs > now) {
          await Notifications.scheduleNotificationAsync({
            identifier: `${ev.id}_r${mins}`,
            content: {
              title: `⏰ ${medicationName} — ещё не принято`,
              body: `Напоминаем: ${mins} мин назад было время приёма`,
              data: { intakeId: ev.id },
              categoryIdentifier: CATEGORY_ID,
              sound: true,
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: new Date(reminderMs),
            },
          });
        }
      }
    }
  }

  // Уведомление о конце упаковки
  const lastEvent = toSchedule[toSchedule.length - 1];
  if (lastEvent) {
    const warningDate = new Date(lastEvent.scheduled_at);
    warningDate.setDate(warningDate.getDate() - 3);
    if (warningDate.getTime() > now) {
      await Notifications.scheduleNotificationAsync({
        identifier: `low_supply_${events[0]?.course_id}`,
        content: {
          title: '📦 Заканчиваются таблетки',
          body: `${medicationName}: осталось примерно 3 дня. Пора купить новую упаковку.`,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: warningDate,
        },
      });
    }
  }
}

export async function cancelCourseNotifications(courseId: string, eventIds: string[]): Promise<void> {
  for (const id of eventIds) {
    await cancelIntakeNotifications(id);
  }
  await Notifications.cancelScheduledNotificationAsync(`low_supply_${courseId}`);
}

export async function cancelNotificationsForMedication(medicationId: string): Promise<void> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ id: string; course_id: string }>(
    `SELECT ie.id, ie.course_id
     FROM intake_events ie
     JOIN courses c ON ie.course_id = c.id
     WHERE c.medication_id = ?`,
    [medicationId],
  );
  for (const row of rows) {
    await cancelIntakeNotifications(row.id);
  }
  const courseIds = [...new Set(rows.map((r) => r.course_id))];
  for (const cId of courseIds) {
    await Notifications.cancelScheduledNotificationAsync(`low_supply_${cId}`);
  }
}

export function handleNotificationResponse(
  response: Notifications.NotificationResponse,
): void {
  const intakeId = response.notification.request.content.data?.intakeId as string | undefined;
  if (!intakeId) return;

  const action = response.actionIdentifier;
  if (action === 'taken') {
    markIntakeEvent(intakeId, 'taken').catch(() => {});
    cancelIntakeNotifications(intakeId).catch(() => {});
  } else if (action === 'missed') {
    markIntakeEvent(intakeId, 'missed').catch(() => {});
    cancelIntakeNotifications(intakeId).catch(() => {});
  }
}

export async function markOverdueIntakes(
  pendingIntakes: IntakeEvent[],
  thresholdHours = 4,
): Promise<string[]> {
  const cutoff = Date.now() - thresholdHours * 60 * 60 * 1000;
  const overdue = pendingIntakes.filter(
    (e) => e.status === 'pending' && new Date(e.scheduled_at).getTime() < cutoff,
  );
  for (const ev of overdue) {
    await markIntakeEvent(ev.id, 'missed');
    await cancelIntakeNotifications(ev.id);
  }
  return overdue.map((e) => e.id);
}
