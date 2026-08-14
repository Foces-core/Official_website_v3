import { describe, it, expect, afterEach, vi } from 'vitest';
import { SPLASH_FAILSAFE_MS, skipSplash, paintReady } from '../../src/utils/bootSplashLogic.js';

// The seam is the boot-splash decisions behind Root()'s effect in main.jsx:
// whether to skip the splash entirely (slow devices, ADR-0001), how long the
// hard failsafe may keep the splash up, and the paint promise that hides it
// right after first paint. The DOM work (classList, remove, load listener)
// stays in the component.

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('skipSplash', () => {
  it('skips the splash on slow networks (ADR-0001: no splash for low-end devices)', () => {
    expect(skipSplash(true)).toBe(true);
  });

  it('keeps the splash on a fast network', () => {
    expect(skipSplash(false)).toBe(false);
  });
});

describe('SPLASH_FAILSAFE_MS', () => {
  it('is 1.5s — long enough for a healthy boot, short enough that a stalled resource cannot occlude the page', () => {
    expect(SPLASH_FAILSAFE_MS).toBe(1500);
  });
});

describe('paintReady', () => {
  it('resolves only after two animation frames (first frame paints the hero)', async () => {
    let frames = 0;
    vi.stubGlobal('requestAnimationFrame', (cb) => {
      frames += 1;
      cb();
      return frames;
    });
    await expect(paintReady()).resolves.toBeUndefined();
    expect(frames).toBe(2);
  });
});
