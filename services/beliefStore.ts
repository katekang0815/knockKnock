import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BeliefStore, BeliefProfile, SessionRecord, BibleVerse } from '@/types/belief';

const STORAGE_KEY = 'knockknock.belief.v1';
const SCHEMA_VERSION = 1;

// Caps — these bound what is stored (and, for the profile, what is resent to the
// AI every turn). Enforced here, not by the model.
const CAP_CORE_BELIEFS = 6;
const CAP_OPEN_QUESTIONS = 5;
const CAP_ISSUES = 3;
const MAX_SESSIONS = 100; // kept for the home feed; only the last 1–2 ever reach the AI

export const EMPTY_PROFILE: BeliefProfile = {
  currentStance: '',
  coreBeliefs: [],
  openQuestions: [],
  toneNotes: null,
};

/** The shape returned by the end-of-session extraction call (aiService). */
export interface BeliefUpdate {
  currentStance: string;
  coreBeliefs: string[];
  openQuestions: string[];
  toneNotes: string | null;
  summary: string;
  issues: string[];
  verse: BibleVerse | null;
}

/** Metadata about the session being recorded. */
export interface SessionMeta {
  emotion: string;
  category: string;
  context: string | null;
}

function nowISO(): string {
  return new Date().toISOString();
}

function emptyStore(): BeliefStore {
  const now = nowISO();
  return {
    version: SCHEMA_VERSION,
    createdAt: now,
    updatedAt: now,
    profile: { ...EMPTY_PROFILE },
    sessions: [],
  };
}

function genId(): string {
  return `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

const clean = (arr: string[] | undefined): string[] =>
  (arr ?? []).map((s) => (typeof s === 'string' ? s.trim() : '')).filter(Boolean);

/** Load the belief store, returning a fresh empty one if absent or corrupt. */
export async function loadBeliefStore(): Promise<BeliefStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as Partial<BeliefStore>;
    return {
      version: parsed.version ?? SCHEMA_VERSION,
      createdAt: parsed.createdAt ?? nowISO(),
      updatedAt: parsed.updatedAt ?? nowISO(),
      profile: { ...EMPTY_PROFILE, ...(parsed.profile ?? {}) },
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
    };
  } catch {
    return emptyStore();
  }
}

export async function saveBeliefStore(store: BeliefStore): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Best-effort — a failed write shouldn't break the check-in flow.
  }
}

/**
 * Apply an end-of-session extraction result: rewrite the profile (with caps)
 * and prepend a new SessionRecord. Returns the saved record.
 *
 * Arrays are rewritten from the update (the extraction is told to return the
 * full merged list), but an empty update array falls back to the existing value
 * so a single glitchy extraction can't wipe an established profile.
 */
export async function recordSession(
  update: BeliefUpdate,
  meta: SessionMeta,
): Promise<SessionRecord> {
  const store = await loadBeliefStore();
  const now = nowISO();
  const prev = store.profile;

  const nextCore = clean(update.coreBeliefs);
  const nextQuestions = clean(update.openQuestions);

  store.profile = {
    currentStance: update.currentStance?.trim() || prev.currentStance,
    coreBeliefs: (nextCore.length ? nextCore : prev.coreBeliefs).slice(0, CAP_CORE_BELIEFS),
    openQuestions: (nextQuestions.length ? nextQuestions : prev.openQuestions).slice(0, CAP_OPEN_QUESTIONS),
    toneNotes: update.toneNotes?.trim() ? update.toneNotes.trim() : prev.toneNotes,
  };

  const record: SessionRecord = {
    id: genId(),
    date: now,
    emotion: meta.emotion,
    category: meta.category,
    context: meta.context,
    issues: clean(update.issues).slice(0, CAP_ISSUES),
    summary: update.summary?.trim() ?? '',
    verse:
      update.verse && update.verse.reference?.trim() && update.verse.text?.trim()
        ? { reference: update.verse.reference.trim(), text: update.verse.text.trim() }
        : null,
  };

  store.sessions = [record, ...store.sessions].slice(0, MAX_SESSIONS);
  store.updatedAt = now;
  await saveBeliefStore(store);
  return record;
}

/** Most recent saved check-in, for the home-screen card. */
export async function getLatestSession(): Promise<SessionRecord | null> {
  const store = await loadBeliefStore();
  return store.sessions[0] ?? null;
}

/** All saved check-ins, newest first — for the stacked home-screen list. */
export async function getSessions(): Promise<SessionRecord[]> {
  const store = await loadBeliefStore();
  return store.sessions;
}
