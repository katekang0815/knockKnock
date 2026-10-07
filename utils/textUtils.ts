/**
 * Shared, pure text-processing helpers used across the app's AI call sites.
 * Kept dependency-free so they're trivially unit-testable.
 */

// Clean AI-generated text: no em/en dashes or spaced hyphens, no asterisks,
// no emoji, no doubled-up whitespace.
export function sanitizeAI(s: string): string {
  return s
    .replace(/\s*[—–]\s*/g, ', ')
    .replace(/ - /g, ', ')
    .replace(/\*/g, '')
    .replace(/[\p{Extended_Pictographic}️‍]/gu, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

// Hangul syllables + Jamo — used to detect Korean input so a prayer can follow
// the language the user actually typed in, instead of the language of the
// instruction asking for it.
const KOREAN_RE = /[가-힣㄰-㆏]/;

export function isKorean(text: string): boolean {
  return KOREAN_RE.test(text);
}
