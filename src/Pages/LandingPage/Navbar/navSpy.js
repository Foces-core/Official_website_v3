/**
 * navSpy — the Navbar's pure navigation + scroll decisions (ADR-0009: behavior
 * lives in tested modules; the component wires side effects).
 *
 * Three small interfaces, each owned by its specs in tests/unit/navSpy.spec.js:
 *  - pickActiveSection  — which section is under the scrollspy reference line
 *  - resolveNavAction / resolveLogoAction — where a click goes (route vs.
 *    cross-route-with-anchor vs. same-page scroll)
 *  - coalesceToFrame    — coalesce scroll/resize-driven work to one rAF
 */

// The scrollspy reference line sits at 35% down the viewport; the page counts
// as "at the bottom" within 50px of its end. These policies live here, where
// the specs pin them, instead of in the component.
export const REF_LINE_RATIO = 0.35;
export const NEAR_BOTTOM_MARGIN_PX = 50;

/**
 * Decide the active navbar section for a given scroll position.
 *
 * Sections are lazy-loaded (ScrollGate / Suspense), so `getTop(id)` returns
 * null until a section is mounted; unmounted sections are skipped in both the
 * reference-line scan and the near-bottom fallback.
 *
 * @param {{ sectionIds: string[], scrollY: number, viewportH: number,
 *           docHeight: number, getTop: (id: string) => number | null }} input
 * @returns {string} the active section id ('home' if nothing has mounted)
 */
export function pickActiveSection({ sectionIds, scrollY, viewportH, docHeight, getTop }) {
  const refY = viewportH * REF_LINE_RATIO;
  const isNearBottom = viewportH + scrollY >= docHeight - NEAR_BOTTOM_MARGIN_PX;

  // Last section whose top has crossed the reference line wins (DOM order).
  let current = null;
  for (const id of sectionIds) {
    const top = getTop(id);
    if (top != null && top <= refY) current = id;
  }

  // Near the footer, highlight the last section actually present in the DOM —
  // even if it hasn't crossed the reference line yet.
  if (isNearBottom) {
    for (let i = sectionIds.length - 1; i >= 0; i--) {
      if (getTop(sectionIds[i]) != null) {
        current = sectionIds[i];
        break;
      }
    }
  }

  // Nothing mounted yet → highlight the first item. sectionIds always starts
  // with 'home' (see Navbar's navItems), so this is the same fallback as the
  // original component logic.
  return current ?? 'home';
}

/**
 * Decide where a nav-item click goes. The returned action is pure data; the
 * component performs the side effects (navigate / scrollIntoView / focus).
 *
 * @param {string} id — the nav item id ('home' … 'contact')
 * @param {string} pathname — current route path
 * @returns {{ type: 'route', to: '/contact' } |
 *           { type: 'navigate', to: '/', state: { id } } |
 *           { type: 'scroll' }}
 */
export function resolveNavAction(id, pathname) {
  // Contact is a real route, not a same-page anchor.
  if (id === 'contact') return { type: 'route', to: '/contact' };
  // Any other item from a non-home route: go home, then scroll to the section.
  if (pathname !== '/') return { type: 'navigate', to: '/', state: { id } };
  // Already home: scroll to the section.
  return { type: 'scroll' };
}

/**
 * Decide where the logo click goes.
 * @param {string} pathname — current route path
 * @returns {{ type: 'navigate', to: '/' } | { type: 'scroll-top' }}
 */
export function resolveLogoAction(pathname) {
  if (pathname !== '/') return { type: 'navigate', to: '/' };
  return { type: 'scroll-top' };
}

/**
 * Coalesce repeated calls into a single run per animation frame — scrollspy
 * and is-scrolled reads layout on every scroll tick; one rAF per tick keeps
 * low-end devices from paying layout-thrash (INP guard, ADR-0001).
 *
 * @param {() => void} run — the work to execute once per frame
 * @returns {() => void} schedule — call to schedule (idempotent within a
 *          frame); carries a `.cancel()` to drop a pending run
 */
export function coalesceToFrame(run) {
  let rafId = null;
  const schedule = () => {
    if (rafId != null) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      run();
    });
  };
  schedule.cancel = () => {
    if (rafId != null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };
  return schedule;
}
