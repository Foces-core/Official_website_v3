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
 *
 * Optional `deadlineMs`: when the caller passes a positive number, the
 * coalescer may fire EARLY — after `deadlineMs` of idle — instead of waiting
 * for the next vsync, if the runtime provides the Web-Idle scheduling surface
 * (requestIdleCallback). Effectively: scroll work happens on the earliest
 * idle window up to 8ms long, skipping the full vsync wait when the machine
 * is ahead of its frame deadline. Falls back silently to the plain next-rAF
 * coalescing when no idle surface exists.
 *
 * Returns a wrapper function with a `.cancel()` method to tear down pending frames.
 *
 * @param {() => void} fn
 * @param {Window | { requestAnimationFrame: typeof requestAnimationFrame, cancelAnimationFrame: typeof cancelAnimationFrame }} [win]
 * @param {{ deadlineMs?: number }} [opts] — early-fire budget in ms (default: next frame, no early fire)
 * @returns {(() => void) & { cancel: () => void }}
 */
export function coalesceToFrame(
  fn,
  win = typeof window !== 'undefined' ? window : null,
  opts = {},
) {
  let rafId = null;
  let idleId = null;
  const rAF = getRaf(win);
  const cancelRAF = getCancelRaf(win);
  const deadlineMs =
    typeof opts.deadlineMs === 'number' && opts.deadlineMs > 0 ? opts.deadlineMs : null;
  const idle =
    deadlineMs != null && typeof win?.requestIdleCallback === 'function'
      ? { request: win.requestIdleCallback.bind(win), cancel: win.cancelIdleCallback?.bind(win) }
      : null;

  const clearPending = () => {
    if (rafId != null) {
      cancelRAF(rafId);
      rafId = null;
    }
    if (idleId != null) {
      idle?.cancel?.(idleId);
      idleId = null;
    }
  };

  const run = () => {
    rafId = null;
    idleId = null;
    fn();
  };

  const schedule = () => {
    if (rafId != null || idleId != null) return;
    if (idle) {
      // Early fire: run inside the first idle window that offers at least the
      // requested budget, capped so a long busy stretch cannot delay the tick.
      idleId = idle.request(
        (deadline) => {
          idleId = null;
          if (deadline.timeRemaining() >= deadlineMs || deadline.didTimeout) {
            run();
          } else {
            // No budget this pass — fall back to the next vsync.
            rafId = rAF(run);
          }
        },
        { timeout: deadlineMs },
      );
    } else {
      rafId = rAF(run);
    }
  };
  schedule.cancel = clearPending;
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
