import { describe, expect, it } from 'vitest';
import { randomUnit } from '../../src/utils/secureRandom.js';

describe('randomUnit', () => {
  it('maps the lowest random 32-bit value to zero', () => {
    expect(randomUnit((values) => values.fill(0))).toBe(0);
  });

  it('maps the highest random 32-bit value below one', () => {
    const value = randomUnit((values) => values.fill(0xffffffff));
    expect(value).toBeLessThan(1);
    expect(value).toBeGreaterThan(0.999999999);
  });
});
