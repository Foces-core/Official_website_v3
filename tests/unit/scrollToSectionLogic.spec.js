import { describe, it, expect } from 'vitest';
import {
  targetIdFromLocation,
  shouldScrollToTarget,
  timedOut,
  sectionScrollBehavior,
} from '../../src/utils/scrollToSectionLogic.js';

// The seam is the pure decision logic behind App.jsx's cross-route anchor
// scroll: which target id to scroll to, whether to scroll now, and whether
// the failsafe polling has run out of time. The MutationObserver/polling
// machinery stays in the component; these decisions are what make it correct.

describe('targetIdFromLocation', () => {
  it('prefers the navigation state id over the hash', () => {
    expect(targetIdFromLocation({ id: 'about' }, '#execom')).toBe('about');
  });

  it('falls back to the hash, stripping the leading #', () => {
    expect(targetIdFromLocation(null, '#featuring')).toBe('featuring');
    expect(targetIdFromLocation({}, '#events')).toBe('events');
  });

  it('returns null when neither state id nor hash is present', () => {
    expect(targetIdFromLocation(null, '')).toBeNull();
    expect(targetIdFromLocation({}, '')).toBeNull();
    expect(targetIdFromLocation(undefined, undefined)).toBeNull();
  });
});

describe('shouldScrollToTarget', () => {
  it('scrolls when the element exists and has not been scrolled to yet', () => {
    expect(shouldScrollToTarget({}, false)).toBe(true);
  });

  it('does not scroll when the element is missing (lazy section not mounted yet)', () => {
    expect(shouldScrollToTarget(null, false)).toBe(false);
  });

  it('never scrolls twice for the same navigation', () => {
    expect(shouldScrollToTarget({}, true)).toBe(false);
  });
});

describe('timedOut', () => {
  it('is false before the deadline', () => {
    expect(timedOut(1000, 1500, 5000)).toBe(false);
  });

  it('is true at and after the deadline (failsafe must always fire)', () => {
    expect(timedOut(1000, 6000, 5000)).toBe(true);
    expect(timedOut(1000, 6001, 5000)).toBe(true);
  });
});

describe('sectionScrollBehavior', () => {
  it('returns "auto" when reduced motion is preferred', () => {
    expect(sectionScrollBehavior(true)).toBe('auto');
  });

  it('returns "smooth" when reduced motion is false, null, or undefined', () => {
    expect(sectionScrollBehavior(false)).toBe('smooth');
    expect(sectionScrollBehavior(undefined)).toBe('smooth');
    expect(sectionScrollBehavior(null)).toBe('smooth');
  });
});
