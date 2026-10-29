import { describe, it, expect } from 'vitest';
import { CURTAIN_SETTLE_MS, isRevealKey } from '../../src/utils/curtainLogic.js';

describe('isRevealKey', () => {
  it('reveals on Enter and Escape only', () => {
    expect(isRevealKey('Enter')).toBe(true);
    expect(isRevealKey('Escape')).toBe(true);
    expect(isRevealKey(' ')).toBe(false);
    expect(isRevealKey('ArrowDown')).toBe(false);
    expect(isRevealKey('Tab')).toBe(false);
    expect(isRevealKey('a')).toBe(false);
  });
});

describe('CURTAIN_SETTLE_MS', () => {
  it('is a positive settle window matching the panel transition', () => {
    expect(CURTAIN_SETTLE_MS).toBeGreaterThan(0);
    expect(CURTAIN_SETTLE_MS).toBeLessThanOrEqual(1500);
  });
});
