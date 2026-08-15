import { describe, it, expect } from 'vitest';
import {
  SNAP_GRACE_MS,
  WIND_DOWN_OVERRIDE_MS,
  ARROW_SPIN_GRACE_MS,
  DRAG_OVERRIDE_MS,
  isManualOverrideActive,
} from '../../src/Components/AboutUs/cubeTiming.js';

// The cube's four timing policies used to be bare `Date.now() + N` literals
// scattered across AboutUs.jsx (snap grace, wind-down override, arrow-spin
// grace, drag override). Each gate answers "does a manual action still own
// the cube?" — pinned here so a tuning tweak is a named, tested change.

describe('timing policy constants', () => {
  it('snap grace is 1.2s — wind-down pauses briefly after settling on a face', () => {
    expect(SNAP_GRACE_MS).toBe(1200);
  });

  it('wind-down override is 10s — inertia never interrupts a fresh manual spin', () => {
    expect(WIND_DOWN_OVERRIDE_MS).toBe(10000);
  });

  it('arrow-spin grace is 3s — keyboard spins keep the idle auto-spin away', () => {
    expect(ARROW_SPIN_GRACE_MS).toBe(3000);
  });

  it('drag override is 60s — a drag owns the cube for a full minute', () => {
    expect(DRAG_OVERRIDE_MS).toBe(60000);
  });
});

describe('isManualOverrideActive', () => {
  it('is active while now is before manualUntil', () => {
    expect(isManualOverrideActive(5000, 4999)).toBe(true);
    expect(isManualOverrideActive(5000, 0)).toBe(true);
  });

  it('expires exactly at manualUntil and stays expired after', () => {
    expect(isManualOverrideActive(5000, 5000)).toBe(false);
    expect(isManualOverrideActive(5000, 9000)).toBe(false);
  });

  it('is never active when no override was ever set', () => {
    expect(isManualOverrideActive(0, Date.now())).toBe(false);
  });
});
