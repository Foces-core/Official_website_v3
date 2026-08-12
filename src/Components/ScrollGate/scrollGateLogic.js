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
