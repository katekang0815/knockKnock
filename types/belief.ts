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

/** A saved check-in. Powers the home-screen card and the AI's short-term memory. */
export interface SessionRecord {
  id: string;
  date: string;                // ISO 8601 — date + time on the card
  emotion: string;             // the emotion the user picked (e.g. "anxious")
  category: string;            // Sunny | Stormy | Calm | Breezy
  context: string | null;      // what / who / where
  issue: string;               // what they're facing, in their own words
  verse: BibleVerse | null;    // the verse the AI shared, shown on the home card
}

/** A Bible verse shared during the check-in. */
export interface BibleVerse {
  reference: string;           // "Proverbs 22:6"
  text: string;                // "Start children off on the way they should go; ..."
}
