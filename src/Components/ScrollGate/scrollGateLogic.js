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
 * actually IN the viewport may mount. Below-fold sections stay deferred even
 * though the pre-load margin would otherwise open them at load — their chunk
 * must not download (or evaluate) during the boot window. The first real
 * scroll arms the normal margin rule.
 *
 * @param {number} top            Section top edge relative to the viewport (px).
 * @param {number} viewportHeight Viewport height (px).
 * @returns {boolean}
 */
export function shouldMountAtBoot(top, viewportHeight) {
  return top < viewportHeight;
}
