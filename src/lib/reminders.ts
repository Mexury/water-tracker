import * as Notifications from 'expo-notifications';

import type { Reminders } from './store';

const MESSAGES = [
  'Time for a sip 💧',
  'Your water orb is looking a bit empty 🫧',
  'Hydration check! How about some water?',
  'Hydration break! Drink up 💙',
];

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestReminderPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

export function reminderHours({ startHour, endHour, everyHours }: Reminders): number[] {
  const hours: number[] = [];
  for (let h = startHour; h <= endHour; h += Math.max(1, everyHours)) hours.push(h);
  return hours;
}

/** Replaces all scheduled reminders with one daily notification per reminder hour. */
export async function syncReminders(reminders: Reminders): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!reminders.enabled) return;
  const { granted } = await Notifications.getPermissionsAsync();
  if (!granted) return;
  await Promise.all(
    reminderHours(reminders).map((hour, i) =>
      Notifications.scheduleNotificationAsync({
        content: { title: 'Sip', body: MESSAGES[i % MESSAGES.length] },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute: 0 },
      }),
    ),
  );
}
