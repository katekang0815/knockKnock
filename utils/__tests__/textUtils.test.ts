import { sanitizeAI, isKorean } from '../textUtils';

describe('sanitizeAI', () => {
  it('replaces em and en dashes with a comma', () => {
    expect(sanitizeAI('Take a breath — it helps.')).toBe('Take a breath, it helps.');
    expect(sanitizeAI('Take a breath – it helps.')).toBe('Take a breath, it helps.');
  });

  it('replaces spaced hyphens with a comma', () => {
    expect(sanitizeAI('I hear you - that sounds hard.')).toBe('I hear you, that sounds hard.');
  });

  it('strips asterisks (markdown bold/italics the model sometimes adds)', () => {
    expect(sanitizeAI('This is **important** to remember.')).toBe('This is important to remember.');
  });

  it('strips emoji', () => {
    expect(sanitizeAI('You are loved 🙏✨')).toBe('You are loved');
  });

  it('collapses doubled-up whitespace', () => {
    expect(sanitizeAI('Hello   there,    friend')).toBe('Hello there, friend');
  });

  it('trims leading and trailing whitespace', () => {
    expect(sanitizeAI('  Hello there  ')).toBe('Hello there');
  });

  it('leaves clean text untouched', () => {
    expect(sanitizeAI('Hello there, friend.')).toBe('Hello there, friend.');
  });

  it('handles an empty string', () => {
    expect(sanitizeAI('')).toBe('');
  });
});

describe('isKorean', () => {
  it('detects Korean text', () => {
    expect(isKorean('오늘 많이 힘들었어요')).toBe(true);
  });

  it('detects Korean mixed with English', () => {
    expect(isKorean("I'm feeling 힘들어 today")).toBe(true);
  });

  it('returns false for English-only text', () => {
    expect(isKorean('I am feeling tired today')).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isKorean('')).toBe(false);
  });

  it('returns false for punctuation and emoji only', () => {
    expect(isKorean('... 🙏 !!')).toBe(false);
  });
});
