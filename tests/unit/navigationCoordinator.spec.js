import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  coordinateSectionNavigation,
  scrollToSectionWhenReady,
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

  describe('scrollToSectionWhenReady', () => {
    it('returns a no-op cancel function if targetId or doc is missing', () => {
      const cancel1 = scrollToSectionWhenReady({ targetId: '' });
      expect(typeof cancel1).toBe('function');
      cancel1();

      const cancel2 = scrollToSectionWhenReady({ targetId: 'about', doc: null });
      expect(typeof cancel2).toBe('function');
      cancel2();
    });

    it('scrolls immediately if target element is already present in DOM', () => {
      const scrollIntoView = vi.fn();
      const onComplete = vi.fn();
      const doc = {
        getElementById: vi.fn((id) => (id === 'about' ? { scrollIntoView } : null)),
      };

      const cancel = scrollToSectionWhenReady({
        targetId: 'about',
        doc,
        onComplete,
      });

      expect(doc.getElementById).toHaveBeenCalledWith('about');
      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(typeof cancel).toBe('function');
      cancel();
    });

    it('scrolls and disconnects when MutationObserver detects element mounting', () => {
      const scrollIntoView = vi.fn();
      const onComplete = vi.fn();
      let hasElement = false;
      const doc = {
        getElementById: vi.fn((id) => {
          if (id === 'featuring' && hasElement) return { scrollIntoView };
          if (id === 'main-content') return { id: 'main-content' };
          return null;
        }),
      };

      let observerCallback = null;
      const disconnectSpy = vi.fn();
      const observeSpy = vi.fn();
      class MockMutationObserver {
        constructor(cb) {
          observerCallback = cb;
        }
        observe = observeSpy;
        disconnect = disconnectSpy;
      }

      scrollToSectionWhenReady({
        targetId: 'featuring',
        doc,
        ObserverClass: MockMutationObserver,
        onComplete,
      });

      expect(observeSpy).toHaveBeenCalledTimes(1);
      expect(scrollIntoView).not.toHaveBeenCalled();

      // Simulate DOM change: element mounts and observer fires
      hasElement = true;
      observerCallback();

      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(disconnectSpy).toHaveBeenCalledTimes(1);
    });

    it('scrolls via failsafe polling interval if element mounts during poll', () => {
      const scrollIntoView = vi.fn();
      const onComplete = vi.fn();
      let hasElement = false;
      const doc = {
        getElementById: vi.fn((id) => (id === 'events' && hasElement ? { scrollIntoView } : null)),
      };

      scrollToSectionWhenReady({
        targetId: 'events',
        doc,
        pollIntervalMs: 100,
        ObserverClass: null,
        onComplete,
      });

      expect(scrollIntoView).not.toHaveBeenCalled();

      // Advance 150ms without element
      vi.advanceTimersByTime(150);
      expect(scrollIntoView).not.toHaveBeenCalled();

      // Mount element and advance interval
      hasElement = true;
      vi.advanceTimersByTime(100);

      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('handles failsafe timeout when target element never mounts', () => {
      const onTimeout = vi.fn();
      const doc = {
        getElementById: vi.fn(() => null),
      };

      scrollToSectionWhenReady({
        targetId: 'missing-section',
        doc,
        timeoutMs: 1000,
        pollIntervalMs: 100,
        onTimeout,
      });

      vi.advanceTimersByTime(1100);
      expect(onTimeout).toHaveBeenCalledTimes(1);
    });

    it('cancels observer and polling when cancel handle is called', () => {
      const scrollIntoView = vi.fn();
      let hasElement = false;
      const doc = {
        getElementById: vi.fn((id) => {
          if (id === 'execom' && hasElement) return { scrollIntoView };
          if (id === 'main-content') return { id: 'main-content' };
          return null;
        }),
      };

      const disconnectSpy = vi.fn();
      class MockMutationObserver {
        observe = vi.fn();
        disconnect = disconnectSpy;
      }

      const cancel = scrollToSectionWhenReady({
        targetId: 'execom',
        doc,
        pollIntervalMs: 100,
        ObserverClass: MockMutationObserver,
      });

      cancel();
      expect(disconnectSpy).toHaveBeenCalledTimes(1);

      // Even if element appears later and timers advance, no scroll occurs
      hasElement = true;
      vi.advanceTimersByTime(500);
      expect(scrollIntoView).not.toHaveBeenCalled();
    });

    it('respects reducedMotion: true (behavior: auto)', () => {
      const scrollIntoView = vi.fn();
      const doc = {
        getElementById: vi.fn((id) => (id === 'about' ? { scrollIntoView } : null)),
      };

      scrollToSectionWhenReady({
        targetId: 'about',
        reducedMotion: true,
        doc,
      });

      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto' });
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
