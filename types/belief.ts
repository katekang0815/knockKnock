// types/belief.ts
//
// On-device memory for the AI spiritual companion: a rolling window of recent
// check-ins (~1 week). Each check-in records the user's emotional state, what
// they're facing (in their own words), and the Bible verse the AI shared — so
// the AI can track ongoing situations across recent days and offer fresh verses
// and prayers. No long-term "belief profile" / no paid extraction call.

/** Everything persisted on-device, under one AsyncStorage key. */
export interface BeliefStore {
  version: number;
  createdAt: string;           // ISO 8601
  updatedAt: string;           // ISO 8601
  sessions: SessionRecord[];   // newest first — home cards + the AI's recent-days memory
}

/** One entry in the saved conversation transcript, in the order it appeared. */
export interface ChatEntry {
  role: 'ai' | 'user';
  text: string;
  kind?: 'prayer' | 'verse';   // tags the AI's verse card / prayer messages
}

/** A saved check-in. Powers the home-screen card and the AI's short-term memory. */
export interface SessionRecord {
  id: string;
  date: string;                // ISO 8601 — date + time on the card
  emotion: string;             // the emotion the user picked (e.g. "anxious")
  category: string;            // Sunny | Stormy | Calm | Breezy
  context: string | null;      // what / who / where
  issue: string;               // what they're facing, in their own words
  verse: BibleVerse | null;    // the verse the AI shared (kept for the AI's memory)
  prayer: string | null;       // the prayer the AI wrote (kept for the AI's memory)
  transcript?: ChatEntry[];    // the full conversation, in order — shown when the card is tapped
}

/** A Bible verse shared during the check-in. */
export interface BibleVerse {
  reference: string;           // "Proverbs 22:6"
  text: string;                // "Start children off on the way they should go; ..."
}
