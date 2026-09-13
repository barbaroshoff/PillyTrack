import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import type { IntakeEvent } from '../db/intakes';
import { markIntakeEvent } from '../db/intakes';

const CATEGORY_ID = 'intake_reminder';
const MAX_SCHEDULED = 60;

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

export async function scheduleIntakeNotifications(
  medicationName: string,
  events: IntakeEvent[],
): Promise<void> {
  const granted = await requestNotificationPermissions();
  if (!granted) return;

  const now = Date.now();
  const toSchedule = events
    .filter((e) => new Date(e.scheduled_at).getTime() > now)
    .slice(0, MAX_SCHEDULED);

  for (const ev of toSchedule) {
    const trigger = new Date(ev.scheduled_at);
    await Notifications.scheduleNotificationAsync({
      identifier: ev.id,
      content: {
        title: `Время принять ${medicationName}`,
        body: 'Не забудьте про лекарство',
        data: { intakeId: ev.id },
        categoryIdentifier: CATEGORY_ID,
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: trigger },
    });
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
          title: 'Заканчиваются таблетки',
          body: `${medicationName}: осталось примерно 3 дня. Пора купить новую упаковку.`,
          sound: true,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: warningDate },
      });
    }
  }
}

export async function cancelCourseNotifications(courseId: string, eventIds: string[]): Promise<void> {
  for (const id of eventIds) {
    await Notifications.cancelScheduledNotificationAsync(id);
  }
  await Notifications.cancelScheduledNotificationAsync(`low_supply_${courseId}`);
}

export function handleNotificationResponse(
  response: Notifications.NotificationResponse,
): void {
  const intakeId = response.notification.request.content.data?.intakeId as string | undefined;
  if (!intakeId) return;

  const action = response.actionIdentifier;
  if (action === 'taken') {
    markIntakeEvent(intakeId, 'taken').catch(() => {});
  } else if (action === 'missed') {
    markIntakeEvent(intakeId, 'missed').catch(() => {});
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
  }
  return overdue.map((e) => e.id);
}
