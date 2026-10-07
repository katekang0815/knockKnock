import { generateId } from '../deviceId';

describe('generateId', () => {
  it('produces an RFC-4122-ish v4 UUID', () => {
    const id = generateId();
    // 8-4-4-4-12 hex groups, version nibble "4", variant nibble in [8, 9, a, b].
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('produces a different id on every call', () => {
    const ids = new Set(Array.from({ length: 200 }, () => generateId()));
    // With a proper v4-shaped id, 200 draws colliding would indicate a broken
    // generator, not bad luck.
    expect(ids.size).toBe(200);
  });
});
