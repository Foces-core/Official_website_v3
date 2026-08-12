import { describe, it, expect } from 'vitest';
import { srcset } from '../../src/utils/srcset.js';

describe('srcset', () => {
  it('joins [url, width] pairs into a srcset attribute string', () => {
    expect(
      srcset([
        ['/assets/episode-1.webp', 1280],
        ['/assets/episode-1-960.webp', 960],
        ['/assets/episode-1-480.webp', 480],
      ]),
    ).toBe(
      '/assets/episode-1.webp 1280w, /assets/episode-1-960.webp 960w, /assets/episode-1-480.webp 480w',
    );
  });

  it('returns an empty string for an empty variant list', () => {
    expect(srcset([])).toBe('');
  });

  it('handles a single variant', () => {
    expect(srcset([['/assets/series.webp', 1000]])).toBe('/assets/series.webp 1000w');
  });

  it('preserves arbitrary widths (non-standard sizes included)', () => {
    expect(
      srcset([
        ['/a.webp', 320],
        ['/b.webp', 640],
      ]),
    ).toBe('/a.webp 320w, /b.webp 640w');
  });

  it('works with URLs that already carry query strings', () => {
    expect(srcset([['/img.webp?v=2', 800]])).toBe('/img.webp?v=2 800w');
  });
});
