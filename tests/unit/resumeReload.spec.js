import { test, expect } from 'vitest';
import { PAGE_RESUME_RELOAD_MS, shouldReloadOnResume } from '../../src/utils/resumeReload.js';

test('does not reload after a short background (under the threshold)', () => {
  expect(shouldReloadOnResume({ hiddenAt: 0, visibleAt: PAGE_RESUME_RELOAD_MS - 1 })).toBe(false);
});

test('reloads when the hidden duration reaches the threshold', () => {
  expect(shouldReloadOnResume({ hiddenAt: 0, visibleAt: PAGE_RESUME_RELOAD_MS })).toBe(true);
});

test('reloads when the tab was hidden longer than the threshold', () => {
  expect(
    shouldReloadOnResume({ hiddenAt: 1000, visibleAt: 1000 + PAGE_RESUME_RELOAD_MS + 60_000 }),
  ).toBe(true);
});

test('honors a custom thresholdMs instead of the default', () => {
  expect(shouldReloadOnResume({ hiddenAt: 0, visibleAt: 30_000, thresholdMs: 30_000 })).toBe(true);
  expect(shouldReloadOnResume({ hiddenAt: 0, visibleAt: 29_999, thresholdMs: 30_000 })).toBe(false);
});

test('never reloads when the hidden timestamp is missing', () => {
  expect(shouldReloadOnResume({ hiddenAt: null, visibleAt: 100_000 })).toBe(false);
  expect(shouldReloadOnResume({ hiddenAt: undefined, visibleAt: 100_000 })).toBe(false);
});

test('never reloads on a negative duration (clock skew)', () => {
  expect(shouldReloadOnResume({ hiddenAt: 200_000, visibleAt: 100_000 })).toBe(false);
});

test('never reloads on negative timestamps', () => {
  expect(shouldReloadOnResume({ hiddenAt: -5, visibleAt: 10 })).toBe(false);
});

test('handles non-number types via typeof guard', () => {
  expect(shouldReloadOnResume({ hiddenAt: '0', visibleAt: 100_000 })).toBe(false);
  expect(shouldReloadOnResume({ hiddenAt: 0, visibleAt: '100000' })).toBe(false);
  expect(shouldReloadOnResume({ hiddenAt: NaN, visibleAt: 100_000 })).toBe(false);
  expect(shouldReloadOnResume({})).toBe(false);
});

test('handles zero threshold edge', () => {
  expect(shouldReloadOnResume({ hiddenAt: 0, visibleAt: 0, thresholdMs: 0 })).toBe(true);
  expect(shouldReloadOnResume({ hiddenAt: 5, visibleAt: 5, thresholdMs: 0 })).toBe(true);
});
