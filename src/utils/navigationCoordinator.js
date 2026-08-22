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

// ---------------------------------------------------------------------------
// Pure guards & resolvers — each CC < 5, deterministic from inputs, testable
// ---------------------------------------------------------------------------

function isMissingParams(targetId, doc) {
  return !targetId || !doc;
}

function getMainContainer(doc) {
  return doc.getElementById('main-content') || doc.body;
}

function canUseObserver(ObserverClass, container) {
  return Boolean(ObserverClass && container);
}

function hasObserveMethod(observer) {
  return Boolean(observer && typeof observer.observe === 'function');
}

function hasDisconnectMethod(observer) {
  return Boolean(observer && typeof observer.disconnect === 'function');
}

function hasSetInterval(win) {
  return Boolean(win && typeof win.setInterval === 'function');
}

function hasClearInterval(win) {
  return Boolean(win && typeof win.clearInterval === 'function');
}

function shouldAttemptScroll(cancelled, scrolled) {
  return !cancelled && !scrolled;
}

function canScrollElement(el) {
  return Boolean(el && typeof el.scrollIntoView === 'function');
}

function shouldInvokeCallback(fn) {
  return typeof fn === 'function';
}

function shouldHandlePoll(found, startTime, now, timeoutMs) {
  return found || timedOut(startTime, now, timeoutMs);
}

function shouldNotifyTimeout(wasScrolled, onTimeout) {
  return !wasScrolled && typeof onTimeout === 'function';
}

function shouldCloseOverlay(closeOverlay) {
  return typeof closeOverlay === 'function';
}

function isIntervalActive(intervalRef) {
  return intervalRef !== null;
}

// ---------------------------------------------------------------------------
// Pure effect helpers — small, testable, CC < 5
// ---------------------------------------------------------------------------

function getScrollTarget(doc, targetId) {
  return doc.getElementById(targetId);
}

function executeScroll(el, reducedMotion, onComplete) {
  if (canScrollElement(el)) {
    el.scrollIntoView({ behavior: sectionScrollBehavior(reducedMotion) });
  }
  if (shouldInvokeCallback(onComplete)) {
    onComplete();
  }
}

function performScrollAttempt({ doc, targetId, scrolled, cancelled, reducedMotion, onComplete }) {
  if (!shouldAttemptScroll(cancelled, scrolled)) return false;
  const el = getScrollTarget(doc, targetId);
  if (!shouldScrollToTarget(el, scrolled)) return false;
  executeScroll(el, reducedMotion, onComplete);
  return true;
}

function resolveSetIntervalFn(win) {
  if (hasSetInterval(win)) return win.setInterval.bind(win);
  return setInterval;
}

function clearStoredInterval(intervalRef, win) {
  if (!isIntervalActive(intervalRef)) return null;
  if (hasClearInterval(win)) {
    win.clearInterval(intervalRef);
  } else {
    clearInterval(intervalRef);
  }
  return null;
}

function clearStoredObserver(observer) {
  if (!hasDisconnectMethod(observer)) return null;
  observer.disconnect();
  return null;
}

function createObserver(ObserverClass, container, onMutation) {
  try {
    const obs = new ObserverClass(onMutation);
    if (hasObserveMethod(obs)) {
      obs.observe(container, { childList: true, subtree: true });
    }
    return obs;
  } catch {
    return null;
  }
}

function setupObserver({ doc, ObserverClass, onMutation }) {
  const container = getMainContainer(doc);
  if (!canUseObserver(ObserverClass, container)) return null;
  return createObserver(ObserverClass, container, onMutation);
}

function createPollTick({
  getCancelled,
  tryScroll,
  getScrolled,
  onCleanup,
  onTimeout,
  getStartTime,
  timeoutMs,
}) {
  return () => {
    if (getCancelled()) return;
    const found = tryScroll();
    if (!shouldHandlePoll(found, getStartTime(), Date.now(), timeoutMs)) return;
    const wasScrolled = getScrolled();
    onCleanup();
    if (shouldNotifyTimeout(wasScrolled, onTimeout)) onTimeout();
  };
}

function createTryScroll({
  doc,
  targetId,
  getScrolled,
  getCancelled,
  reducedMotion,
  onComplete,
  setScrolled,
}) {
  return () => {
    const didScroll = performScrollAttempt({
      doc,
      targetId,
      scrolled: getScrolled(),
      cancelled: getCancelled(),
      reducedMotion,
      onComplete,
    });
    if (didScroll) setScrolled(true);
    return didScroll;
  };
}

function createMutationCallback(tryScroll, cleanup) {
  return () => {
    if (tryScroll()) cleanup();
  };
}

function maybeCloseOverlay(closeOverlay) {
  if (shouldCloseOverlay(closeOverlay)) closeOverlay();
}

// ---------------------------------------------------------------------------
// Coordinators — thin orchestration, CC < 5, delegating to helpers above
// ---------------------------------------------------------------------------

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
  if (isMissingParams(targetId, doc)) return () => {};

  let cancelled = false;
  let scrolled = false;
  let observer = null;
  let intervalRef = null;
  const startTime = Date.now();

  const cleanup = () => {
    intervalRef = clearStoredInterval(intervalRef, win);
    observer = clearStoredObserver(observer);
  };

  const tryScroll = createTryScroll({
    doc,
    targetId,
    getScrolled: () => scrolled,
    getCancelled: () => cancelled,
    reducedMotion,
    onComplete,
    setScrolled: (v) => {
      scrolled = v;
    },
  });

  if (tryScroll()) return () => {};

  observer = setupObserver({
    doc,
    ObserverClass,
    onMutation: createMutationCallback(tryScroll, cleanup),
  });

  const pollTick = createPollTick({
    getCancelled: () => cancelled,
    tryScroll,
    getScrolled: () => scrolled,
    onCleanup: cleanup,
    onTimeout,
    getStartTime: () => startTime,
    timeoutMs,
  });

  const setIntervalFn = resolveSetIntervalFn(win);
  intervalRef = setIntervalFn(pollTick, pollIntervalMs);

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
  if (isMissingParams(targetId, doc)) return () => {};

  maybeCloseOverlay(closeOverlay);

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
