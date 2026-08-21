/**
 * Generic frame utilities built on requestAnimationFrame:
 * - coalesceToFrame: coalesces high-frequency events (scroll/resize) to at most one callback per animation frame.
 * - deferToNextPaint: defers execution until after the next paint (two requestAnimationFrame ticks) with a cancel handle.
 */

/**
 * Resolve the appropriate requestAnimationFrame function.
 * Pure helper — no side effects, deterministic from `win` and globals.
 *
 * @param {Window | { requestAnimationFrame: typeof requestAnimationFrame } | null} win
 * @returns {(cb: FrameRequestCallback) => number}
 */
function getRaf(win) {
  if (win && typeof win.requestAnimationFrame === 'function') {
    return win.requestAnimationFrame.bind(win);
  }
  if (typeof requestAnimationFrame !== 'undefined') {
    return requestAnimationFrame;
  }
  return (cb) => setTimeout(cb, 16);
}

/**
 * Resolve the appropriate cancelAnimationFrame function.
 * Pure helper — no side effects, deterministic from `win` and globals.
 *
 * @param {Window | { cancelAnimationFrame: typeof cancelAnimationFrame } | null} win
 * @returns {(id: number) => void}
 */
function getCancelRaf(win) {
  if (win && typeof win.cancelAnimationFrame === 'function') {
    return win.cancelAnimationFrame.bind(win);
  }
  if (typeof cancelAnimationFrame !== 'undefined') {
    return cancelAnimationFrame;
  }
  return (id) => clearTimeout(id);
}

/**
 * Coalesce multiple calls within the same animation frame into a single execution.
 * Returns a wrapper function with a `.cancel()` method to tear down pending frames.
 *
 * @param {() => void} fn
 * @param {Window | { requestAnimationFrame: typeof requestAnimationFrame, cancelAnimationFrame: typeof cancelAnimationFrame }} [win]
 * @returns {(() => void) & { cancel: () => void }}
 */
export function coalesceToFrame(fn, win = typeof window !== 'undefined' ? window : null) {
  let rafId = null;
  const rAF = getRaf(win);
  const cancelRAF = getCancelRaf(win);

  const schedule = () => {
    if (rafId != null) return;
    rafId = rAF(() => {
      rafId = null;
      fn();
    });
  };
  schedule.cancel = () => {
    if (rafId != null) {
      cancelRAF(rafId);
      rafId = null;
    }
  };
  return schedule;
}

/**
 * Defer a callback until after the next paint (two requestAnimationFrame ticks).
 * Useful when overlay DOM unmount or body scroll-lock release must settle before
 * focus restoration or section scroll calculations run.
 *
 * @param {() => void} fn — the callback to run after the next paint
 * @param {Window | { requestAnimationFrame: typeof requestAnimationFrame, cancelAnimationFrame: typeof cancelAnimationFrame }} [win]
 * @returns {() => void} cancel handle
 */
export function deferToNextPaint(fn, win = typeof window !== 'undefined' ? window : null) {
  let firstId = null;
  let secondId = null;

  const rAF = getRaf(win);
  const cancelRAF = getCancelRaf(win);

  firstId = rAF(() => {
    firstId = null;
    secondId = rAF(() => {
      secondId = null;
      if (typeof fn === 'function') {
        fn();
      }
    });
  });

  return () => {
    if (firstId != null) cancelRAF(firstId);
    if (secondId != null) cancelRAF(secondId);
    firstId = null;
    secondId = null;
  };
}
