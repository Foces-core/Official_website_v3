import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  coordinateSectionNavigation,
  manageOverlayScrollLock,
  sectionScrollBehavior,
  targetIdFromLocation,
} from '../../src/utils/navigationCoordinator.js';

describe('navigationCoordinator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('coordinateSectionNavigation', () => {
    it('returns a no-op cancel function if targetId or doc is missing', () => {
      const cancel1 = coordinateSectionNavigation({ targetId: '' });
      expect(typeof cancel1).toBe('function');
      cancel1();

      const cancel2 = coordinateSectionNavigation({ targetId: 'about', doc: null });
      expect(typeof cancel2).toBe('function');
      cancel2();
    });

    it('invokes closeOverlay immediately before deferring scroll to next paint', () => {
      const closeOverlay = vi.fn();
      const scrollIntoView = vi.fn();
      const doc = {
        getElementById: vi.fn((id) => (id === 'about' ? { scrollIntoView } : null)),
      };

      coordinateSectionNavigation({
        targetId: 'about',
        doc,
        closeOverlay,
      });

      expect(closeOverlay).toHaveBeenCalledTimes(1);
      expect(scrollIntoView).not.toHaveBeenCalled();

      // Advance two animation frames for deferToNextPaint
      vi.advanceTimersByTime(40);

      expect(doc.getElementById).toHaveBeenCalledWith('about');
      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
    });

    it('respects prefers-reduced-motion: true (behavior: auto)', () => {
      const scrollIntoView = vi.fn();
      const doc = {
        getElementById: vi.fn(() => ({ scrollIntoView })),
      };

      coordinateSectionNavigation({
        targetId: 'events',
        doc,
        reducedMotion: true,
      });

      vi.advanceTimersByTime(40);
      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto' });
    });

    it('invokes onComplete callback after paint deferral', () => {
      const onComplete = vi.fn();
      const doc = {
        getElementById: vi.fn(() => ({ scrollIntoView: vi.fn() })),
      };

      coordinateSectionNavigation({
        targetId: 'home',
        doc,
        onComplete,
      });

      expect(onComplete).not.toHaveBeenCalled();
      vi.advanceTimersByTime(40);
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('cancels pending deferred navigation if cancel handle is invoked', () => {
      const scrollIntoView = vi.fn();
      const onComplete = vi.fn();
      const doc = {
        getElementById: vi.fn(() => ({ scrollIntoView })),
      };

      const cancel = coordinateSectionNavigation({
        targetId: 'featuring',
        doc,
        onComplete,
      });

      cancel();
      vi.advanceTimersByTime(50);

      expect(scrollIntoView).not.toHaveBeenCalled();
      expect(onComplete).not.toHaveBeenCalled();
    });
  });

  describe('manageOverlayScrollLock', () => {
    it('returns a no-op when isOpen is false', () => {
      const release = manageOverlayScrollLock(false);
      expect(typeof release).toBe('function');
      release();
    });

    it('acquires body lock when isOpen is true and releases on cleanup', () => {
      const release = manageOverlayScrollLock(true);
      expect(typeof release).toBe('function');
      release();
    });
  });

  describe('re-exported helpers', () => {
    it('targetIdFromLocation resolves id from state or hash', () => {
      expect(targetIdFromLocation({ id: 'execom' }, '')).toBe('execom');
      expect(targetIdFromLocation(null, '#about')).toBe('about');
      expect(targetIdFromLocation(null, '')).toBe(null);
    });

    it('sectionScrollBehavior maps boolean reducedMotion to auto / smooth', () => {
      expect(sectionScrollBehavior(true)).toBe('auto');
      expect(sectionScrollBehavior(false)).toBe('smooth');
    });
  });
});
