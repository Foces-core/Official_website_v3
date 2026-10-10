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

/**
 * Idle-arm rule: decides which gate is safe to arm (pre-mount) during browser
 * idle time after load, before the user has scrolled. The FIRST gate below the
 * fold is armed — usually the cube section (about) — because the most likely
 * first real interaction on the page is the first scroll/first nav-anchor tap,
 * and pre-mounting one section makes that interaction respond instantly while
 * still costing nothing during boot (runs after load, in idle).
 *
 * @param {{
 *   ids: string[],
 *   tops?: (string | null)[],
 *   viewportHeight: number,
 *   armedIds?: string[],
 * }} input
 *   ids          Gate ids in DOM order.
 *   tops         Top edge per id (px, same order) — null when not mounted.
 *                Defaults to ids.map(() => null) (no DOM knowledge).
 *   viewportHeight
 *   armedIds     Gates already armed or mounted.
 * @returns {string | null} the next gate id to arm, or null when none.
 */
export function nextGateToArmAtIdle({ ids, tops, viewportHeight, armedIds = [] } = {}) {
  if (!Array.isArray(ids) || ids.length === 0) return null;
  const armed = new Set(armedIds);
  const forTops = Array.isArray(tops) ? tops : ids.map(() => null);
  for (let i = 0; i < ids.length; i += 1) {
    const id = ids[i];
    if (armed.has(id)) continue;
    // A gate whose placeholder already sits within the pre-load margin
    // (mounted-none yet, top within 0.5 viewport below fold) wins outright.
    const top = forTops[i];
    if (top == null || top <= viewportHeight * 1.5) return id;
    // Later gates stay deferred: arming them early pulls their chunk during
    // the exact window that must stay free for first-interaction responsiveness.
    return null;
  }
  return null;
}
