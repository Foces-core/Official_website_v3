import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  createSpinTracker,
  SPIN_BARS,
  spinConfigFor,
} from '../../src/Components/AboutUs/easterEggLogic.js';

// The seam is the tracker's register() -> boolean interface: it counts 90°
// spins and fires exactly once when `target` spins arrive within `gap` ms of
// each other. The bars come from the module's SPIN_BARS (single source of
// truth — AboutUs.jsx picks touch vs desktop from the same constants). Times
// are passed in explicitly so the sequence logic is fully deterministic; the
// Date.now() default is pinned with fake timers.

const DESKTOP = SPIN_BARS.desktop;
const TOUCH = SPIN_BARS.touch;

afterEach(() => {
  vi.useRealTimers();
});

describe('createSpinTracker — counting and firing', () => {
  it('returns false for the first spin', () => {
    expect(createSpinTracker(DESKTOP).register(0)).toBe(false);
  });

  it('fires exactly when the target is reached, then starts a fresh run', () => {
    const tracker = createSpinTracker({ target: 3, gap: 800 });
    expect(tracker.register(0)).toBe(false);
    expect(tracker.register(100)).toBe(false);
    expect(tracker.register(200)).toBe(true); // 3rd spin within gap
    expect(tracker.register(300)).toBe(false); // fresh run — never double-fires
  });

  it('keeps counting consecutive spins within the gap', () => {
    const tracker = createSpinTracker({ target: 4, gap: 800 });
    for (let i = 0; i < 3; i += 1) {
      expect(tracker.register(i * 100)).toBe(false);
    }
    expect(tracker.register(300)).toBe(true);
  });
});

describe('createSpinTracker — gap reset', () => {
  it('resets the counter when a spin arrives after the gap (casual spinning never fires)', () => {
    const tracker = createSpinTracker({ target: 3, gap: 800 });
    tracker.register(0);
    tracker.register(100);
    // Long pause — the burst dies; the next spin restarts at 1.
    expect(tracker.register(1000)).toBe(false);
    expect(tracker.register(1100)).toBe(false);
    expect(tracker.register(1200)).toBe(true); // still 3 rapid spins needed
  });

  it('a single spin separated by long gaps never fires', () => {
    const tracker = createSpinTracker({ target: 5, gap: 800 });
    for (let i = 0; i < 20; i += 1) {
      expect(tracker.register(i * 5000)).toBe(false);
    }
  });
});

describe('createSpinTracker — device bars', () => {
  it('desktop fires after 20 rapid spins (0.8s window)', () => {
    const tracker = createSpinTracker(DESKTOP);
    for (let i = 0; i < 19; i += 1) {
      expect(tracker.register(i * 40)).toBe(false);
    }
    expect(tracker.register(19 * 40)).toBe(true);
  });

  it('touch phones fire after 8 rapid spins (1.5s window) — the easier bar', () => {
    const tracker = createSpinTracker(TOUCH);
    for (let i = 0; i < 7; i += 1) {
      expect(tracker.register(i * 120)).toBe(false);
    }
    expect(tracker.register(7 * 120)).toBe(true);
  });

  it('touch bar still respects the wider gap: a 1.4s pause keeps the burst alive', () => {
    const tracker = createSpinTracker({ target: 3, gap: TOUCH.gap });
    tracker.register(0);
    tracker.register(1400); // within the 1.5s touch window
    expect(tracker.register(2800)).toBe(true);
  });
});

describe('spinConfigFor — which bar applies', () => {
  it('coarse pointers (touch-first phones) get the easier bar', () => {
    expect(spinConfigFor(true)).toBe(SPIN_BARS.touch);
  });

  it('fine pointers get the desktop bar', () => {
    expect(spinConfigFor(false)).toBe(SPIN_BARS.desktop);
  });
});

describe('createSpinTracker — default clock', () => {
  it('uses Date.now() when no timestamp is given', () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    const tracker = createSpinTracker({ target: 2, gap: 800 });
    expect(tracker.register()).toBe(false);
    vi.setSystemTime(1100);
    expect(tracker.register()).toBe(true);
  });

  it('register returns false while below target even with exact-gap spacing', () => {
    const tracker = createSpinTracker({ target: 3, gap: 800 });
    expect(tracker.register(0)).toBe(false);
    expect(tracker.register(800)).toBe(false);
  });

  it('spin arriving exactly at the gap boundary keeps the run alive (not >)', () => {
    const tracker = createSpinTracker({ target: 2, gap: 800 });
    tracker.register(0);
    expect(tracker.register(800)).toBe(true);
  });

  it('spin arriving 1ms past the gap resets the count', () => {
    const tracker = createSpinTracker({ target: 2, gap: 800 });
    tracker.register(0);
    expect(tracker.register(801)).toBe(false);
  });
});
