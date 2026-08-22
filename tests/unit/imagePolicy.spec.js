import { describe, it, expect } from 'vitest';
import { IMAGE_WIDTH_TIERS, resolveMaxImageWidth, capSrcset } from '../../src/utils/imagePolicy.js';

describe('resolveMaxImageWidth — profile → width cap', () => {
  it('caps to the slowNetwork tier (400w) on a slow network', () => {
    expect(resolveMaxImageWidth({ slowNetwork: true })).toBe(IMAGE_WIDTH_TIERS.slowNetwork);
  });

  it('lets slow network win over low CPU', () => {
    expect(resolveMaxImageWidth({ slowNetwork: true, lowCPU: true })).toBe(
      IMAGE_WIDTH_TIERS.slowNetwork,
    );
  });

  it('caps to the lowCPU tier (800w) on low CPU only', () => {
    expect(resolveMaxImageWidth({ lowCPU: true })).toBe(IMAGE_WIDTH_TIERS.lowCPU);
  });

  it('allows the full tier (1000w) on capable devices', () => {
    expect(resolveMaxImageWidth({ slowNetwork: false, lowCPU: false })).toBe(
      IMAGE_WIDTH_TIERS.full,
    );
    expect(resolveMaxImageWidth({})).toBe(IMAGE_WIDTH_TIERS.full);
    expect(resolveMaxImageWidth()).toBe(IMAGE_WIDTH_TIERS.full);
    expect(resolveMaxImageWidth(undefined)).toBe(IMAGE_WIDTH_TIERS.full);
  });
});

describe('capSrcset — enforce the cap on a srcset string', () => {
  const triplet = '/a.webp 1000w, /a-800.webp 800w, /a-400.webp 400w';

  it('keeps only candidates at or under the cap, preserving order', () => {
    expect(capSrcset(triplet, 800)).toBe('/a-800.webp 800w, /a-400.webp 400w');
  });

  it('keeps the 400w candidate under the slow-network cap', () => {
    expect(capSrcset(triplet, 400)).toBe('/a-400.webp 400w');
  });

  it('is a no-op when the cap covers the full triplet', () => {
    expect(capSrcset(triplet, 1000)).toBe(triplet);
  });

  it('floors to the smallest candidate when every candidate exceeds the cap', () => {
    // Echo slides only ship 480w+ — an empty srcset would fall back to the
    // full-size `src` and defeat the cap, so the smallest candidate must
    // survive even when it is wider than the cap.
    const echo = '/b.webp 1280w, /b-960.webp 960w, /b-480.webp 480w';
    expect(capSrcset(echo, 400)).toBe('/b-480.webp 480w');
  });

  it('passes a missing or empty srcset through unchanged', () => {
    expect(capSrcset(undefined, 400)).toBeUndefined();
    expect(capSrcset('', 400)).toBe('');
    expect(capSrcset(null, 400)).toBeNull();
  });

  it('returns the original string when no candidate parses', () => {
    expect(capSrcset('garbage-with-no-width', 400)).toBe('garbage-with-no-width');
    expect(capSrcset('/a.webp notawidth, /b.webp 100x', 400)).toBe(
      '/a.webp notawidth, /b.webp 100x',
    );
  });

  it('parses candidates with extra whitespace and multiple spaces', () => {
    expect(capSrcset('  /a.webp   800w  ,  /b.webp 400w ', 800)).toBe('/a.webp 800w, /b.webp 400w');
  });

  it('keeps equal-to-cap width (boundary <=)', () => {
    const pair = '/a.webp 800w';
    expect(capSrcset(pair, 800)).toBe(pair);
  });

  it('floor picks strictly smallest when all exceed cap (reduce min)', () => {
    const set = '/big.webp 2000w, /mid.webp 1500w, /small.webp 1200w';
    expect(capSrcset(set, 400)).toBe('/small.webp 1200w');
  });
});
