import { describe, it, expect } from 'vitest';
import {
  shouldStartWindDown,
  computeDragDelta,
  isIdleForAutoSpin,
} from '../../src/utils/cubeDragHelpers.js';

describe('cubeDragHelpers', () => {
  describe('shouldStartWindDown', () => {
    it('false at 0', () => expect(shouldStartWindDown(0)).toBe(false));
    it('false below min', () => expect(shouldStartWindDown(0.001)).toBe(false));
    it('true moderate', () => expect(shouldStartWindDown(0.1)).toBe(true));
    it('true rapid', () => expect(shouldStartWindDown(0.5)).toBe(true));
  });
  describe('computeDragDelta', () => {
    it('0 when same', () => expect(computeDragDelta(100, 100, 0.6)).toBe(0));
    it('positive', () => expect(computeDragDelta(200, 100, 0.6)).toBe(60));
    it('negative', () => expect(computeDragDelta(0, 100, 0.6)).toBe(-60));
    it('scales', () => expect(computeDragDelta(10, 0, 1)).toBe(10));
  });
  describe('isIdleForAutoSpin', () => {
    const base = {
      isDragging: false,
      winding: false,
      manualUntil: 0,
      visible: true,
      now: 1000,
    };
    it('true when idle', () => expect(isIdleForAutoSpin(base)).toBe(true));
    it('false dragging', () =>
      expect(isIdleForAutoSpin({ ...base, isDragging: true })).toBe(false));
    it('false winding', () => expect(isIdleForAutoSpin({ ...base, winding: true })).toBe(false));
    it('false not visible', () =>
      expect(isIdleForAutoSpin({ ...base, visible: false })).toBe(false));
    it('false manual active', () =>
      expect(isIdleForAutoSpin({ ...base, manualUntil: 2000 })).toBe(false));
    it('true manual expired', () =>
      expect(isIdleForAutoSpin({ ...base, manualUntil: 500 })).toBe(true));
  });
});
