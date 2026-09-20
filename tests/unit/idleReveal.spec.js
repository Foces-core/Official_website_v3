import { describe, it, expect } from 'vitest';
import { DEFAULT_IDLE_REVEAL_MS, shouldShowIdleReveal } from '../../src/utils/idleReveal.js';

describe('idleReveal — shouldShowIdleReveal', () => {
  it('stays visible while the area was touched within the idle window', () => {
    expect(
      shouldShowIdleReveal({
        lastActivityAt: 1000,
        now: 1000 + DEFAULT_IDLE_REVEAL_MS - 1,
        idleMs: DEFAULT_IDLE_REVEAL_MS,
      }),
    ).toBe(true);
  });

  it('hides once the idle window has fully elapsed', () => {
    expect(
      shouldShowIdleReveal({
        lastActivityAt: 1000,
        now: 1000 + DEFAULT_IDLE_REVEAL_MS,
        idleMs: DEFAULT_IDLE_REVEAL_MS,
      }),
    ).toBe(false);
  });

  it('honors a custom idle window', () => {
    expect(shouldShowIdleReveal({ lastActivityAt: 0, now: 400, idleMs: 500 })).toBe(true);
    expect(shouldShowIdleReveal({ lastActivityAt: 0, now: 501, idleMs: 500 })).toBe(false);
  });

  it('fails open on unusable inputs — controls never stuck hidden', () => {
    expect(shouldShowIdleReveal({})).toBe(true);
    expect(shouldShowIdleReveal({ lastActivityAt: 'x', now: 1 })).toBe(true);
    expect(shouldShowIdleReveal({ lastActivityAt: 0, now: NaN })).toBe(true);
    expect(shouldShowIdleReveal({ lastActivityAt: 0, now: 10_000, idleMs: 0 })).toBe(true);
    expect(shouldShowIdleReveal({ lastActivityAt: 0, now: 10_000, idleMs: -5 })).toBe(true);
  });
});
