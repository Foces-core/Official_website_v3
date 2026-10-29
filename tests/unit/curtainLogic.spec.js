import { describe, it, expect } from 'vitest';
import {
  CURTAIN_POP_COUNT,
  CURTAIN_SETTLE_MS,
  createCurtainParticle,
  isRevealKey,
} from '../../src/utils/curtainLogic.js';

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

describe('curtain constants', () => {
  it('keeps the settle window long enough for panels and confetti', () => {
    expect(CURTAIN_SETTLE_MS).toBeGreaterThanOrEqual(1300);
    expect(CURTAIN_SETTLE_MS).toBeLessThanOrEqual(2500);
  });

  it('fires a modest confetti burst', () => {
    expect(CURTAIN_POP_COUNT).toBeGreaterThan(0);
    expect(CURTAIN_POP_COUNT).toBeLessThanOrEqual(200);
  });

  it('seeds a downward-biased burst that decays', () => {
    const right = createCurtainParticle(1, () => 0.99);
    expect(right.vx).toBeGreaterThan(0);
    expect(right.vy).toBeGreaterThan(0);

    const left = createCurtainParticle(-1, () => 0.01);
    expect(left.vx).toBeLessThan(0);

    const centre = createCurtainParticle(0, () => 0.5);
    expect(centre.vx).toBeLessThanOrEqual(4);
    expect(centre.vx).toBeGreaterThanOrEqual(-4);
    expect(centre.decay).toBeGreaterThan(0);
  });
});
