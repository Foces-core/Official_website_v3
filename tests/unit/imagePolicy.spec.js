import { describe, it, expect } from 'vitest';
import { capSrcset } from '../../src/utils/imagePolicy.js';

// The width POLICY (which cap a device gets) moved into the experience-tier
// matrix (utils/experienceTier.js, `imageMaxWidth` capability) — pinned by
// tests/unit/experienceTier.spec.js. This spec covers the string mechanics
// only.
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
});
