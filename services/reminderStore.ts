import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

/**
 * Daily reminder notifications, stored on-device. Each reminder schedules its own
 * local notification (no server/push) at a chosen time, or a random daytime slot
 * when "Surprise me" is on. The user can keep several reminders per day.
 */

const KEY = 'knockknock.reminders.v1';
const LEGACY_KEY = 'knockknock.reminder.v1'; // old single-reminder object

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
  id: string;
  hour: number; // 0-23
  minute: number; // 0-59
  surprise: boolean;
  notifId?: string;
}

function genId(): string {
  return (
    'xxxxxxxx'.replace(/x/g, () => ((Math.random() * 16) | 0).toString(16)) +
    Date.now().toString(36)
  );
}

/** All reminders, in the order they were added. Migrates the old single reminder. */
export async function getReminders(): Promise<Reminder[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Reminder[];

    // One-time migration from the legacy single-reminder object.
    const legacy = await AsyncStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const old = JSON.parse(legacy) as Omit<Reminder, 'id'>;
      const migrated: Reminder[] = [{ ...old, id: genId() }];
      await AsyncStorage.setItem(KEY, JSON.stringify(migrated));
      await AsyncStorage.removeItem(LEGACY_KEY);
      return migrated;
    }
    return [];
  } catch {
    return [];
  }
}

async function writeReminders(list: Reminder[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
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

async function schedule(hour: number, minute: number): Promise<string> {
  return Notifications.scheduleNotificationAsync({
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
}

async function cancel(notifId?: string): Promise<void> {
  if (!notifId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notifId);
  } catch {
    // already gone
  }
}

/** Schedule a new daily reminder and append it. */
export async function addReminder(input: {
  hour: number;
  minute: number;
  surprise: boolean;
}): Promise<Reminder> {
  const { hour, minute } = input.surprise ? randomTime() : input;
  const notifId = await schedule(hour, minute);
  const reminder: Reminder = { id: genId(), hour, minute, surprise: input.surprise, notifId };
  const list = await getReminders();
  await writeReminders([...list, reminder]);
  return reminder;
}

/** Reschedule an existing reminder (by id) and persist it. */
export async function updateReminder(
  id: string,
  input: { hour: number; minute: number; surprise: boolean },
): Promise<Reminder | null> {
  const list = await getReminders();
  const idx = list.findIndex((r) => r.id === id);
  if (idx === -1) return null;

  await cancel(list[idx].notifId);
  const { hour, minute } = input.surprise ? randomTime() : input;
  const notifId = await schedule(hour, minute);
  const updated: Reminder = { id, hour, minute, surprise: input.surprise, notifId };
  const next = [...list];
  next[idx] = updated;
  await writeReminders(next);
  return updated;
}

/** Cancel and forget a single reminder. */
export async function removeReminder(id: string): Promise<void> {
  const list = await getReminders();
  const target = list.find((r) => r.id === id);
  await cancel(target?.notifId);
  await writeReminders(list.filter((r) => r.id !== id));
}
