import { describe, it, expect } from 'vitest';
import { normalizeIndex, wrapTarget } from '../../src/Components/Execom/carouselWrap.js';

// The seam is the pure wrap math behind TeamCarousel's seamless-infinite
// carousel: 3 copies of the card list are rendered (no Swiper loop — the cube
// rotates 90° per face, which loop mode can't reconcile), and a 0ms jump
// between copies makes the wrap invisible. normalizeIndex maps a raw swiper
// index (0..3*total-1) onto the visible card, and wrapTarget says which copy
// to jump to when the raw index leaves the middle copy.

const TOTAL = 11;

describe('normalizeIndex', () => {
  it('maps every copy onto the same card (index % total)', () => {
    expect(normalizeIndex(0, TOTAL)).toBe(0);
    expect(normalizeIndex(11, TOTAL)).toBe(0);
    expect(normalizeIndex(22, TOTAL)).toBe(0);
    expect(normalizeIndex(10, TOTAL)).toBe(10);
    expect(normalizeIndex(21, TOTAL)).toBe(10);
    expect(normalizeIndex(32, TOTAL)).toBe(10);
  });
});

describe('wrapTarget', () => {
  it('returns null inside the middle copy (no jump needed)', () => {
    expect(wrapTarget(11, TOTAL)).toBeNull();
    expect(wrapTarget(15, TOTAL)).toBeNull();
    expect(wrapTarget(21, TOTAL)).toBeNull();
  });

  it('jumps forward by one copy when the swiper wraps past the last copy', () => {
    expect(wrapTarget(22, TOTAL)).toBe(11);
    expect(wrapTarget(32, TOTAL)).toBe(21);
  });

  it('jumps back by one copy when the swiper wraps before the first copy', () => {
    expect(wrapTarget(0, TOTAL)).toBe(11);
    expect(wrapTarget(10, TOTAL)).toBe(21);
  });
});
