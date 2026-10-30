import { describe, it, expect } from 'vitest';
import { AUTOPLAY_RESUME_MS } from '../../src/utils/carouselTiming.js';

describe('carouselTiming', () => {
  it('parks autoplay for a multi-second window after each interaction', () => {
    expect(Number.isInteger(AUTOPLAY_RESUME_MS)).toBe(true);
    expect(AUTOPLAY_RESUME_MS).toBeGreaterThanOrEqual(1000);
  });
});
