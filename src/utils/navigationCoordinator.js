import { acquireScrollLock } from './scrollLock.js';
import { deferToNextPaint } from '../Pages/LandingPage/Navbar/navSpy.js';
import { sectionScrollBehavior, targetIdFromLocation } from './scrollToSectionLogic.js';

/**
 * Viewport & Navigation Coordinator — a deep module coordinating section scrolling,
 * overlay dismissal, body scroll-lock release, double-rAF paint deferral, and focus shifts.
 */

/**
 * Coordinates scrolling to a section, ensuring overlays are dismissed, body scroll-locks
 * released, and layout settled (via double-rAF) before the scroll calculation executes.
 *
 * @param {{
 *   targetId: string,
 *   doc?: { getElementById: (id: string) => { scrollIntoView: (opts?: any) => void } | null },
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
  reducedMotion = false,
  closeOverlay,
  onComplete,
}) {
  if (!targetId || !doc) return () => {};

  if (typeof closeOverlay === 'function') {
    closeOverlay();
  }

  const cancelDefer = deferToNextPaint(() => {
    const el = doc.getElementById(targetId);
    if (el && typeof el.scrollIntoView === 'function') {
      const behavior = sectionScrollBehavior(reducedMotion);
      el.scrollIntoView({ behavior });
    }
    if (typeof onComplete === 'function') {
      onComplete();
    }
  });

  return cancelDefer;
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

export { targetIdFromLocation, sectionScrollBehavior, deferToNextPaint };
