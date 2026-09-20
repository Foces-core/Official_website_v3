import { describe, it, expect } from 'vitest';
import {
  normalizeIndex,
  wrapTarget,
  copyFor,
  neighborIndices,
} from '../../src/utils/carouselWrap.js';

// The seam is the pure wrap math behind the seamless-infinite carousels
// (Execom's TeamCarousel AND the Featuring ECHO carousel): 3 copies of the
// slide list are rendered (no Swiper loop — the cube rotates 90° per face,
// which loop mode can't reconcile), and a 0ms jump between copies makes the
// wrap invisible. normalizeIndex maps a raw swiper index (0..3*total-1) onto
// the visible card, wrapTarget says which copy to jump to when the raw index
// leaves the middle copy, and copyFor reports which copy an index is in.

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

describe('copyFor', () => {
  it('is the zero-based copy number an index lives in (floor division)', () => {
    expect(copyFor(0, 4)).toBe(0);
    expect(copyFor(3, 4)).toBe(0);
    expect(copyFor(4, 4)).toBe(1);
    expect(copyFor(7, 4)).toBe(1);
    expect(copyFor(8, 4)).toBe(2);
    expect(copyFor(11, 4)).toBe(2);
  });
});

describe('neighborIndices — the prefetch list around a slide', () => {
  it('returns wrap-aware prev/next at radius 1, self excluded', () => {
    expect(neighborIndices(0, 4)).toEqual([3, 1]);
    expect(neighborIndices(2, 4)).toEqual([1, 3]);
  });

  it('radius 2 returns two on each side, still wrap-aware', () => {
    expect(neighborIndices(0, 5, 2)).toEqual([4, 1, 3, 2]);
  });

  it('clamps radius to total-1 and degrades small lists', () => {
    expect(neighborIndices(0, 2, 5)).toEqual([1]);
    expect(neighborIndices(0, 1)).toEqual([]);
  });

  it('is empty on unusable inputs', () => {
    expect(neighborIndices(0.5, 4)).toEqual([]);
    expect(neighborIndices(0, NaN)).toEqual([]);
  });
});
