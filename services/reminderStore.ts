import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

/**
 * A single daily reminder notification, stored on-device. Schedules a local
 * notification (no server/push) at a chosen time, or a random daytime slot when
 * "Surprise me" is on.
 */

const KEY = 'knockknock.reminder.v1';

// Show the reminder even if the app is foregrounded when it fires.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface Reminder {
  hour: number; // 0-23
  minute: number; // 0-59
  surprise: boolean;
  notifId?: string;
}

export async function getReminder(): Promise<Reminder | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Reminder) : null;
  } catch {
    return null;
  }
}

/** Ask for notification permission; returns true if granted. */
export async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted || current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

// Random daytime slot (08:00–19:55, 5-min steps) for "Surprise me".
function randomTime(): { hour: number; minute: number } {
  const hour = 8 + Math.floor(Math.random() * 12);
  const minute = Math.floor(Math.random() * 12) * 5;
  return { hour, minute };
}

/** Schedule (replacing any existing) the daily reminder and persist it. */
export async function saveReminder(input: {
  hour: number;
  minute: number;
  surprise: boolean;
}): Promise<Reminder> {
  const existing = await getReminder();
  if (existing?.notifId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(existing.notifId);
    } catch {
      // already gone
    }
  }

  const { hour, minute } = input.surprise ? randomTime() : input;
  const notifId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'KnockKnock',
      body: 'A moment to pray and reflect. 🙏',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  const reminder: Reminder = { hour, minute, surprise: input.surprise, notifId };
  await AsyncStorage.setItem(KEY, JSON.stringify(reminder));
  return reminder;
}

/** Cancel and forget the reminder. */
export async function clearReminder(): Promise<void> {
  const existing = await getReminder();
  if (existing?.notifId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(existing.notifId);
    } catch {
      // already gone
    }
  }
  await AsyncStorage.removeItem(KEY);
}
