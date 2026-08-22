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
 * Boot-time rule: before the user has scrolled at all, only a section that is
 * meaningfully IN the viewport may mount — its top edge must have crossed the
 * 90% visibility line. Sections merely touching the fold (top ≈ viewport
 * height) stay deferred even though a pixel or two may paint, so their chunk
 * never downloads or evaluates during the boot window (layout jitter around
 * the exact fold line made an equality check flaky). The first real scroll
 * arms the normal margin rule.
 *
 * @param {number} top            Section top edge relative to the viewport (px).
 * @param {number} viewportHeight Viewport height (px).
 * @returns {boolean}
 */
export function shouldMountAtBoot(top, viewportHeight) {
  return top < viewportHeight * 0.9;
}
