import { describe, it, expect } from 'vitest';
import {
  shouldMountSection,
  shouldMountAtBoot,
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

describe('shouldMountAtBoot — pre-scroll rule', () => {
  const VIEWPORT = 800;

  it('mounts a section inside the viewport at load', () => {
    expect(shouldMountAtBoot(0, VIEWPORT)).toBe(true);
    expect(shouldMountAtBoot(VIEWPORT - 1, VIEWPORT)).toBe(true);
  });

  it('defers a section just below the fold even though the margin would open it', () => {
    // #about sits ~1 viewport down: the armed margin (1.5x) would mount it at
    // boot, but before any scroll the boot rule keeps its chunk unloaded.
    expect(shouldMountAtBoot(VIEWPORT + 100, VIEWPORT)).toBe(false);
    expect(shouldMountSection(VIEWPORT + 100, VIEWPORT, 0.5)).toBe(true);
  });

  it('boundary: top exactly at the fold is NOT visible — stays deferred', () => {
    expect(shouldMountAtBoot(VIEWPORT, VIEWPORT)).toBe(false);
    expect(shouldMountAtBoot(VIEWPORT + 1, VIEWPORT)).toBe(false);
  });
});
