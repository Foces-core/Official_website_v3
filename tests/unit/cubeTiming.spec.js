import { describe, it, expect } from 'vitest';
import {
  SNAP_GRACE_MS,
  WIND_DOWN_OVERRIDE_MS,
  ARROW_SPIN_GRACE_MS,
  DRAG_OVERRIDE_MS,
  isManualOverrideActive,
} from '../../src/utils/cubeTiming.js';

describe('cubeTiming constants', () => {
  it('SNAP_GRACE_MS is 1200', () => {
    expect(SNAP_GRACE_MS).toBe(1200);
  });
  it('WIND_DOWN_OVERRIDE_MS is 10000', () => {
    expect(WIND_DOWN_OVERRIDE_MS).toBe(10000);
  });
  it('ARROW_SPIN_GRACE_MS is 3000', () => {
    expect(ARROW_SPIN_GRACE_MS).toBe(3000);
  });
  it('DRAG_OVERRIDE_MS is 60000', () => {
    expect(DRAG_OVERRIDE_MS).toBe(60000);
  });
});

describe('isManualOverrideActive', () => {
  it('true when now < manualUntil', () => {
    expect(isManualOverrideActive(1000, 500)).toBe(true);
  });
  it('false when now >= manualUntil', () => {
    expect(isManualOverrideActive(1000, 1000)).toBe(false);
    expect(isManualOverrideActive(1000, 1500)).toBe(false);
  });
  it('false when manualUntil is 0 (never set)', () => {
    expect(isManualOverrideActive(0, Date.now())).toBe(false);
  });
});
