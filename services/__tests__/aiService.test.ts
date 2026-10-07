import { containsSafetyKeywords, relativeDay } from '../aiService';

describe('containsSafetyKeywords', () => {
  it('flags direct crisis language', () => {
    expect(containsSafetyKeywords('I want to kill myself')).toBe(true);
    expect(containsSafetyKeywords('sometimes I think about suicide')).toBe(true);
    expect(containsSafetyKeywords("I don't want to be alive anymore")).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(containsSafetyKeywords('I WANT TO DIE')).toBe(true);
  });

  it('matches a keyword embedded in a longer sentence', () => {
    expect(containsSafetyKeywords('honestly I just feel like nobody cares about me')).toBe(true);
  });

  it('does not flag ordinary difficult-but-safe language', () => {
    expect(containsSafetyKeywords("I'm feeling really anxious about work today")).toBe(false);
    expect(containsSafetyKeywords('I had a rough day and I feel exhausted')).toBe(false);
  });

  it('does not flag an empty message', () => {
    expect(containsSafetyKeywords('')).toBe(false);
  });
});

describe('relativeDay', () => {
  // Build an ISO string N calendar days before "now", so the test stays valid
  // no matter what date it's actually run on.
  function daysAgoISO(n: number): string {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString();
  }

  const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  it('labels a timestamp from today as "earlier today"', () => {
    expect(relativeDay(daysAgoISO(0))).toBe('earlier today');
  });

  it('labels a future timestamp as "earlier today" too (never a negative day count)', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(relativeDay(tomorrow.toISOString())).toBe('earlier today');
  });

  it('labels yesterday as "yesterday"', () => {
    expect(relativeDay(daysAgoISO(1))).toBe('yesterday');
  });

  it('labels 2-6 days ago with a day count', () => {
    expect(relativeDay(daysAgoISO(3))).toBe('3 days ago');
    expect(relativeDay(daysAgoISO(6))).toBe('6 days ago');
  });

  it('labels 7+ days ago with the weekday name, not a day count', () => {
    const d = new Date();
    d.setDate(d.getDate() - 10);
    expect(relativeDay(d.toISOString())).toBe(WEEKDAYS[d.getDay()]);
  });

  it('returns an empty string for an invalid date', () => {
    expect(relativeDay('not-a-real-date')).toBe('');
  });
});
