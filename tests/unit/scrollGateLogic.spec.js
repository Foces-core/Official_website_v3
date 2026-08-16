import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  shouldMountSection,
  scheduleIdleMount,
} from '../../src/Components/ScrollGate/scrollGateLogic.js';

describe('shouldMountSection', () => {
  const VIEWPORT = 800;

  it('mounts a section already at the top of the viewport', () => {
    expect(shouldMountSection(0, VIEWPORT)).toBe(true);
  });

  it('mounts a section scrolled past (negative top)', () => {
    expect(shouldMountSection(-250, VIEWPORT)).toBe(true);
  });

  it('mounts a section exactly at the fold', () => {
    expect(shouldMountSection(VIEWPORT, VIEWPORT)).toBe(true);
  });

  it('mounts a section within the pre-load margin below the fold (boundary inclusive)', () => {
    // Default margin is 0.5 viewports: threshold is 800 * 1.5 = 1200.
    expect(shouldMountSection(1200, VIEWPORT)).toBe(true);
    expect(shouldMountSection(1199, VIEWPORT)).toBe(true);
  });

  it('keeps a section farther below the fold unmounted', () => {
    expect(shouldMountSection(1201, VIEWPORT)).toBe(false);
  });

  it('respects a custom margin fraction', () => {
    // marginFraction 0: only content inside the viewport mounts.
    expect(shouldMountSection(799, VIEWPORT, 0)).toBe(true);
    expect(shouldMountSection(800, VIEWPORT, 0)).toBe(true);
    expect(shouldMountSection(801, VIEWPORT, 0)).toBe(false);
  });

  it('returns false for a section below the fold with a tiny margin', () => {
    expect(shouldMountSection(810, VIEWPORT, 0.01)).toBe(false);
  });
});

describe('scheduleIdleMount', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('schedules onMount after delayMs elapses', () => {
    const onMount = vi.fn();
    scheduleIdleMount({ onMount, delayMs: 1000 });

    expect(onMount).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(onMount).toHaveBeenCalledTimes(1);
  });

  it('cancels scheduled mount when cleanup handle is invoked', () => {
    const onMount = vi.fn();
    const cancel = scheduleIdleMount({ onMount, delayMs: 1000 });

    cancel();
    vi.advanceTimersByTime(1500);
    expect(onMount).not.toHaveBeenCalled();
  });

  it('does nothing when slowNetwork is active', () => {
    const onMount = vi.fn();
    scheduleIdleMount({ onMount, delayMs: 1000, slowNetwork: true });

    vi.advanceTimersByTime(1500);
    expect(onMount).not.toHaveBeenCalled();
  });
});
