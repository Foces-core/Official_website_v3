/**
 * Pure mount-decision for ScrollGate, extracted so the geometry rule is
 * unit-testable without a DOM.
 *
 * A section mounts when its top edge has reached the fold OR is within
 * `marginFraction` viewports below it (the pre-load head start that lets the
 * chunk download while the user scrolls). Sections scrolled past (negative
 * top) always mount.
 *
 * @param {number} top            Section top edge relative to the viewport (px).
 * @param {number} viewportHeight Viewport height (px).
 * @param {number} marginFraction Head-start margin as a fraction of the viewport.
 * @returns {boolean}
 */
export function shouldMountSection(top, viewportHeight, marginFraction = 0.5) {
  return top <= viewportHeight * (1 + marginFraction);
}

/**
 * Schedules background idle mounting of deferred off-screen sections once the
 * active page content has settled and the main thread is idle.
 *
 * @param {Object} options
 * @param {() => void} options.onMount
 * @param {number} [options.delayMs=2000]
 * @param {boolean} [options.slowNetwork=false]
 * @returns {() => void} Cleanup handle
 */
export function scheduleIdleMount({ onMount, delayMs = 2000, slowNetwork = false }) {
  if (slowNetwork || typeof onMount !== 'function') {
    return () => {};
  }

  let timerId = 0;
  let idleId = 0;

  const trigger = () => {
    if (typeof requestIdleCallback !== 'undefined') {
      idleId = requestIdleCallback(() => onMount(), { timeout: 1000 });
    } else {
      onMount();
    }
  };

  timerId = setTimeout(trigger, delayMs);

  return () => {
    if (timerId) clearTimeout(timerId);
    if (idleId && typeof cancelIdleCallback !== 'undefined') {
      cancelIdleCallback(idleId);
    }
  };
}
