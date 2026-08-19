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

/** Delete a note by id. */
export async function deleteNote(id: string): Promise<void> {
  try {
    const notes = await getNotes();
    await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes.filter((n) => n.id !== id)));
  } catch {
    // best-effort
  }
}

/** Save a new note; returns it (or null if empty / on failure). */
export async function saveNote(text: string): Promise<Note | null> {
  const trimmed = text.trim();
  if (!trimmed) return null;
  try {
    const notes = await getNotes();
    const note: Note = { id: genId(), date: new Date().toISOString(), text: trimmed };
    await AsyncStorage.setItem(NOTES_KEY, JSON.stringify([note, ...notes]));
    return note;
  } catch {
    return null;
  }
}
