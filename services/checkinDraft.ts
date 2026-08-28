// One-shot handoff of a "first" emotion between the check-in dial and the
// emotion-log screen. When the user taps "Add Emotion" on the log screen we stash
// the already-chosen emotion here and send them back to the dial to pick a second;
// the dial reads (and clears) it so the log reopens with both emotions.

export interface PendingEmotion {
  emotion: string;
  category: string;
}

let pending: PendingEmotion | null = null;

export function setPendingEmotion(p: PendingEmotion): void {
  pending = p;
}

// Get and clear (one-shot). Returns null when nothing is pending.
export function takePendingEmotion(): PendingEmotion | null {
  const p = pending;
  pending = null;
  return p;
}
