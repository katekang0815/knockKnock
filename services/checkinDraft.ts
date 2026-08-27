// Ephemeral hand-off between the check-in dial and the emotion log when adding a
// second emotion. When the user taps "Add Emotion" on the context screen, we stash
// the first emotion here and pop back to the dial; the dial reads it when the user
// picks the second emotion, then navigates on with both.

type PendingEmotion = { emotion: string; category: string } | null;

let pending: PendingEmotion = null;

export function setPendingEmotion(p: PendingEmotion): void {
  pending = p;
}

/** Read and clear the pending first emotion (one-shot). */
export function takePendingEmotion(): PendingEmotion {
  const p = pending;
  pending = null;
  return p;
}
