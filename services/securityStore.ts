import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { getSessions } from './beliefStore';

/**
 * Security & data preferences (on-device) plus export/delete helpers over all
 * of the app's AsyncStorage data.
 */

const PREFIX = 'knockknock.';

export const SEC_KEYS = {
  faceId: 'knockknock.security.faceId.v1',
  icloud: 'knockknock.security.icloud.v1',
  backup: 'knockknock.security.localBackup.v1',
};

export async function getFlag(key: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(key)) === '1';
  } catch {
    return false;
  }
}

export async function setFlag(key: string, value: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value ? '1' : '0');
  } catch {
    // best-effort
  }
}

function parse(v: string): unknown {
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
}

/** Serialize every knockknock.* value into a single JSON string for export. */
export async function exportAllData(): Promise<string> {
  const all = await AsyncStorage.getAllKeys();
  const keys = all.filter((k) => k.startsWith(PREFIX));
  const entries = await AsyncStorage.multiGet(keys);
  const data: Record<string, unknown> = {};
  for (const [k, v] of entries) data[k] = v == null ? null : parse(v);
  return JSON.stringify(
    { app: 'KnockKnock', exportedAt: new Date().toISOString(), data },
    null,
    2,
  );
}

function csvCell(v: unknown): string {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

/** Export the saved check-ins as a spreadsheet-friendly CSV string. */
export async function exportCsv(): Promise<string> {
  const sessions = await getSessions();
  const header = ['Date', 'Time', 'Emotion', 'Category', 'Context', 'Facing', 'Verse', 'Prayer'];
  const rows = sessions.map((s) => {
    const d = new Date(s.date);
    const valid = !Number.isNaN(d.getTime());
    const date = valid ? d.toLocaleDateString() : s.date;
    const time = valid ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    const verse = s.verse ? `${s.verse.reference} — ${s.verse.text}` : '';
    return [date, time, s.emotion, s.category, s.context ?? '', s.issue, verse, s.prayer ?? ''];
  });
  return [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\n');
}

/** Permanently remove all on-device app data and cancel scheduled reminders. */
export async function deleteAllData(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // no notifications module / nothing scheduled
  }
  const all = await AsyncStorage.getAllKeys();
  const keys = all.filter((k) => k.startsWith(PREFIX));
  await AsyncStorage.multiRemove(keys);
}
