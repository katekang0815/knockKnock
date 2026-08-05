// types/belief.ts
//
// On-device belief-system memory for the AI spiritual companion.
// Persisted under a single AsyncStorage key (see services/beliefStore.ts).
//
// Two tiers:
//   - `profile`  → the AI's evolving understanding of the person (sent every turn)
//   - `sessions` → the log of check-ins; feeds the home-screen cards AND provides
//                  the AI with continuity (only the most recent 1–2 are sent).

/** Everything persisted on-device, under one AsyncStorage key. */
export interface BeliefStore {
  version: number;              // schema version — for future migrations
  createdAt: string;           // ISO 8601
  updatedAt: string;           // ISO 8601
  profile: BeliefProfile;      // the AI's evolving understanding of their belief system
  sessions: SessionRecord[];   // full log — newest first — for home cards + AI continuity
}

/**
 * The AI's understanding of this person's belief system.
 * Rewritten (not appended) after each session so it always reflects their
 * current state — this is how "belief change over time" is captured implicitly.
 * Sent to the AI every turn, so it's kept bounded via the caps in beliefStore.ts.
 */
export interface BeliefProfile {
  currentStance: string;        // 1–3 sentences: their present relationship with faith/God
  coreBeliefs: string[];        // convictions they hold — cap 6
  openQuestions: string[];      // doubts / things they're wrestling with — cap 5
  toneNotes: string | null;     // how they write + how they like to be spoken to
}

/**
 * A saved check-in. Powers the home-screen notification card (date/time,
 * emotion, verse) and gives the AI conversational continuity.
 */
export interface SessionRecord {
  id: string;
  date: string;                 // ISO 8601 — carries both the date and the time on the card
  emotion: string;              // the specific emotion the user picked (e.g. "fomo")
  category: string;             // Sunny | Stormy | Calm | Breezy
  context: string | null;      // what / who / where
  issues: string[];            // concerns raised this session — cap 3 (AI continuity)
  summary: string;             // 1–2 sentence gist of the conversation (AI continuity)
  verse: BibleVerse | null;    // the verse the AI shared — shown on the home card
}

/** A Bible verse shared during the check-in. */
export interface BibleVerse {
  reference: string;            // "Proverbs 22:6"
  text: string;                 // "Start children off on the way they should go; ..."
}
