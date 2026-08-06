import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BeliefStore, SessionRecord, BibleVerse } from '@/types/belief';

const STORAGE_KEY = 'knockknock.belief.v1';
const SCHEMA_VERSION = 2;
const MAX_SESSIONS = 60; // hard cap on stored history
const RECENT_DAYS = 7; // window of check-ins sent to the AI

function nowISO(): string {
  return new Date().toISOString();
}

function emptyStore(): BeliefStore {
  const now = nowISO();
  return { version: SCHEMA_VERSION, createdAt: now, updatedAt: now, sessions: [] };
}

function genId(): string {
  return `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

export async function loadBeliefStore(): Promise<BeliefStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const p = JSON.parse(raw) as Partial<BeliefStore>;
    return {
      version: p.version ?? SCHEMA_VERSION,
      createdAt: p.createdAt ?? nowISO(),
      updatedAt: p.updatedAt ?? nowISO(),
      sessions: Array.isArray(p.sessions) ? p.sessions : [],
    };
  } catch {
    return emptyStore();
  }
}

export async function saveBeliefStore(store: BeliefStore): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // best-effort — a failed write shouldn't break the check-in flow
  }
}

/** A check-in to record — all fields captured for free (no AI call). */
export interface NewCheckIn {
  emotion: string;
  category: string;
  context: string | null;
  issue: string;
  verse: BibleVerse | null;
}

/** Save a check-in and prepend it to the rolling history. */
export async function recordSession(rec: NewCheckIn): Promise<SessionRecord> {
  const store = await loadBeliefStore();
  const record: SessionRecord = {
    id: genId(),
    date: nowISO(),
    emotion: rec.emotion,
    category: rec.category,
    context: rec.context,
    issue: (rec.issue ?? '').trim(),
    verse:
      rec.verse && rec.verse.reference?.trim() && rec.verse.text?.trim()
        ? { reference: rec.verse.reference.trim(), text: rec.verse.text.trim() }
        : null,
  };
  store.sessions = [record, ...store.sessions].slice(0, MAX_SESSIONS);
  store.updatedAt = record.date;
  await saveBeliefStore(store);
  return record;
}

/** All saved check-ins, newest first — for the home card stack. */
export async function getSessions(): Promise<SessionRecord[]> {
  return (await loadBeliefStore()).sessions;
}

/** Most recent saved check-in. */
export async function getLatestSession(): Promise<SessionRecord | null> {
  return (await loadBeliefStore()).sessions[0] ?? null;
}

/** Check-ins within the last N days (default 7) — the AI's short-term memory. */
export async function getRecentSessions(days = RECENT_DAYS): Promise<SessionRecord[]> {
  const store = await loadBeliefStore();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return store.sessions.filter((s) => {
    const t = Date.parse(s.date);
    return Number.isNaN(t) ? true : t >= cutoff;
  });
}

// Matches a Bible reference like "Proverbs 22:6", "1 Peter 5:7", "Philippians 4:6-7".
const VERSE_RE = /\b([1-3]?\s?[A-Z][a-z]+)\s(\d+):(\d+)(?:-(\d+))?\b/;

/**
 * Pull the first Bible reference + the verse text following it out of AI chat
 * text — free, no API call. Returns null if no reference is found.
 */
export function extractVerse(text: string): BibleVerse | null {
  const m = text.match(VERSE_RE);
  if (!m || m.index === undefined) return null;
  const reference = m[0].replace(/\s+/g, ' ').trim();
  // Text after the reference, trimmed of leading separators, up to the first sentence end.
  const after = text.slice(m.index + m[0].length).replace(/^[\s:,.\-–—"']+/, '');
  const end = after.search(/[.!?](\s|$)/);
  const verseText = (end >= 0 ? after.slice(0, end + 1) : after.slice(0, 220)).trim();
  if (!verseText) return null;
  return { reference, text: verseText };
}
