import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Quick notes / reflections the user writes to look back on later. Stored on-device
 * only (no AI, no server) — free to run and consistent with the app's privacy model.
 */

const NOTES_KEY = 'knockknock.notes.v1';

export interface Note {
  id: string;
  date: string; // ISO 8601
  text: string;
  prayer?: string; // AI-generated "quick prayer" saved with the note
}

function genId(): string {
  return (
    'xxxxxxxx'.replace(/x/g, () => ((Math.random() * 16) | 0).toString(16)) +
    Date.now().toString(36)
  );
}

/** All saved notes, newest first. */
export async function getNotes(): Promise<Note[]> {
  try {
    const raw = await AsyncStorage.getItem(NOTES_KEY);
    return raw ? (JSON.parse(raw) as Note[]) : [];
  } catch {
    return [];
  }
}

/** Update an existing note's text (and optional prayer); keeps its id and date. */
export async function updateNote(id: string, text: string, prayer?: string): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;
  try {
    const notes = await getNotes();
    const next = notes.map((n) =>
      n.id === id
        ? { ...n, text: trimmed, ...(prayer && prayer.trim() ? { prayer: prayer.trim() } : {}) }
        : n,
    );
    await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(next));
  } catch {
    // best-effort
  }
}

/** Delete a note by id. */
export async function deleteNote(id: string): Promise<void> {
  try {
    const notes = await getNotes();
    await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes.filter((n) => n.id !== id)));
  } catch {
    // best-effort
  }
}

/**
 * Daily cap on AI "Quick Prayer" generations from the note popup — keeps AI cost
 * bounded. Stored on-device as { day, count }; resets each calendar day.
 */
const QUICK_PRAYER_KEY = 'knockknock.quickprayer.daily.v1';
export const QUICK_PRAYER_DAILY_LIMIT = 5;

function today(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD (local-ish, UTC date)
}

/** How many quick prayers have been generated today. */
export async function getQuickPrayerCount(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(QUICK_PRAYER_KEY);
    if (!raw) return 0;
    const { day, count } = JSON.parse(raw) as { day: string; count: number };
    return day === today() ? count : 0;
  } catch {
    return 0;
  }
}

/** Record one quick-prayer generation; returns the new count for today. */
export async function incrementQuickPrayerCount(): Promise<number> {
  try {
    const current = await getQuickPrayerCount();
    const next = current + 1;
    await AsyncStorage.setItem(QUICK_PRAYER_KEY, JSON.stringify({ day: today(), count: next }));
    return next;
  } catch {
    return await getQuickPrayerCount();
  }
}

/** Save a new note (optionally with a generated prayer); returns it or null. */
export async function saveNote(text: string, prayer?: string): Promise<Note | null> {
  const trimmed = text.trim();
  if (!trimmed) return null;
  try {
    const notes = await getNotes();
    const note: Note = { id: genId(), date: new Date().toISOString(), text: trimmed };
    if (prayer && prayer.trim()) note.prayer = prayer.trim();
    await AsyncStorage.setItem(NOTES_KEY, JSON.stringify([note, ...notes]));
    return note;
  } catch {
    return null;
  }
}
