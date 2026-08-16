import { acquireScrollLock } from './scrollLock.js';
import { deferToNextPaint } from './frameScheduler.js';
import {
  sectionScrollBehavior,
  targetIdFromLocation,
  shouldScrollToTarget,
  timedOut,
} from './scrollToSectionLogic.js';

/**
 * Viewport & Navigation Coordinator — a deep module coordinating section scrolling,
 * lazy element mount observation, failsafe polling, overlay dismissal,
 * body scroll-lock release, double-rAF paint deferral, and focus shifts.
 */

/**
 * Waits for a target section element to mount in the DOM (immediate try, MutationObserver,
 * and failsafe polling) and scrolls to it using the configured section scroll policy.
 *
 * @param {{
 *   targetId: string,
 *   reducedMotion?: boolean,
 *   timeoutMs?: number,
 *   pollIntervalMs?: number,
 *   doc?: Document | { getElementById: (id: string) => any, body?: any },
 *   win?: Window | { setInterval: Function, clearInterval: Function, Date?: any },
 *   ObserverClass?: typeof MutationObserver,
 *   onComplete?: () => void,
 *   onTimeout?: () => void,
 * }} options
 * @returns {() => void} cancelHandle - cleans up observer, polling interval, and cancels scroll
 */
export function scrollToSectionWhenReady({
  targetId,
  reducedMotion = false,
  timeoutMs = 5000,
  pollIntervalMs = 100,
  doc = typeof document !== 'undefined' ? document : null,
  win = typeof window !== 'undefined' ? window : null,
  ObserverClass = typeof MutationObserver !== 'undefined' ? MutationObserver : null,
  onComplete,
  onTimeout,
}) {
  if (!targetId || !doc) return () => {};

  let cancelled = false;
  let scrolled = false;
  let observer = null;
  let intervalRef = null;
  const startTime = Date.now();

  const cleanup = () => {
    if (intervalRef !== null) {
      if (win && typeof win.clearInterval === 'function') {
        win.clearInterval(intervalRef);
      } else {
        clearInterval(intervalRef);
      }
      intervalRef = null;
    }
    if (observer && typeof observer.disconnect === 'function') {
      observer.disconnect();
      observer = null;
    }
  };

  const scrollToTarget = () => {
    if (cancelled || scrolled) return false;
    const el = doc.getElementById(targetId);
    if (shouldScrollToTarget(el, scrolled)) {
      scrolled = true;
      if (typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ behavior: sectionScrollBehavior(reducedMotion) });
      }
      if (typeof onComplete === 'function') {
        onComplete();
      }
      return true;
    }
    return false;
  };

  // 1. Try scrolling immediately if component is already mounted
  if (scrollToTarget()) {
    return () => {};
  }

  // 2. Observe DOM mutations when lazy-loaded Suspense chunks mount
  const mainContainer = doc.getElementById('main-content') || doc.body;
  if (ObserverClass && mainContainer) {
    try {
      observer = new ObserverClass(() => {
        if (scrollToTarget()) {
          cleanup();
        }
      });
      if (typeof observer.observe === 'function') {
        observer.observe(mainContainer, { childList: true, subtree: true });
      }
    } catch {
      // Best-effort: fallback to polling if observer creation throws
      observer = null;
    }
  }

  // 3. Failsafe polling across slow network chunk downloads or background tabs
  const setIntervalFn =
    win && typeof win.setInterval === 'function' ? win.setInterval.bind(win) : setInterval;

  intervalRef = setIntervalFn(() => {
    if (cancelled) return;
    const found = scrollToTarget();
    if (found || timedOut(startTime, Date.now(), timeoutMs)) {
      const wasScrolled = scrolled;
      cleanup();
      if (!wasScrolled && typeof onTimeout === 'function') {
        onTimeout();
      }
    }
  }, pollIntervalMs);

  return () => {
    cancelled = true;
    cleanup();
  };
}

/**
 * Coordinates scrolling to a section, ensuring overlays are dismissed, body scroll-locks
 * released, and layout settled (via double-rAF) before the scroll calculation executes.
 *
 * @param {{
 *   targetId: string,
 *   doc?: Document | { getElementById: (id: string) => any, body?: any },
 *   win?: Window,
 *   reducedMotion?: boolean,
 *   closeOverlay?: () => void,
 *   onComplete?: () => void
 * }} options
 * @returns {() => void} cancelHandle — cancels any pending deferred scroll/paint callback
 */
export function coordinateSectionNavigation({
  targetId,
  doc = typeof document !== 'undefined' ? document : null,
  win = typeof window !== 'undefined' ? window : null,
  reducedMotion = false,
  closeOverlay,
  onComplete,
}) {
  if (!targetId || !doc) return () => {};

  if (typeof closeOverlay === 'function') {
    closeOverlay();
  }

  let cancelScrollWhenReady = () => {};

  const cancelDefer = deferToNextPaint(() => {
    cancelScrollWhenReady = scrollToSectionWhenReady({
      targetId,
      reducedMotion,
      doc,
      win,
      onComplete,
    });
  });

  return () => {
    cancelDefer();
    cancelScrollWhenReady();
  };
}

/**
 * Manages body scroll lock for overlays (modals, mobile drawer, lightboxes).
 * Returns an idempotent cleanup function that releases the lock.
 *
 * @param {boolean} isOpen
 * @returns {() => void} releaseHandle
 */
export function manageOverlayScrollLock(isOpen) {
  if (!isOpen) return () => {};
  return acquireScrollLock();
}

export { targetIdFromLocation, sectionScrollBehavior };
