/**
 * navSpy — the Navbar's pure navigation + scroll decisions (ADR-0009: behavior
 * lives in tested modules; the component wires side effects).
 *
 * Interfaces, each owned by its specs in tests/unit/navSpy.spec.js:
 *  - pickActiveSection / pickOnViewport — which section is under the
 *    scrollspy reference line (pure geometry + the thin DOM-reading wrapper)
 *  - resolveNavAction / resolveLogoAction — where a click goes (route vs.
 *    cross-route-with-anchor vs. same-page scroll)
 *  - coalesceToFrame    — coalesce scroll/resize-driven work to one rAF
 */

// The scrollspy reference line sits at 35% down the viewport; the page counts
// as "at the bottom" within 50px of its end. These policies live here, not in
// the component. They are deliberately NOT exported: knip would flag dead
// exports, and the spec pins them through behavior (refY = 280 at viewportH
// 800 in the worked example) rather than by importing constants.
const REF_LINE_RATIO = 0.35;
const NEAR_BOTTOM_MARGIN_PX = 50;

// Distance scrolled before the navbar swaps to the solid "scrolled"
// treatment. Consumed by Navbar's is-scrolled wiring (coalesceToFrame).
export const SCROLLED_THRESHOLD_PX = 150;

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
 * Thin DOM wrapper over pickActiveSection: reads the live scroll/viewport
 * geometry and each section's getBoundingClientRect().top, and returns the
 * nav item that should be current — null on non-home routes, where no home
 * section is "current" (the navbar falls back to the dark theme), and
 * 'contact' on the contact route.
 *
 * Route awareness lives here so the whole "which nav item is current"
 * decision is unit-tested; the component only wires the result into state.
 * The win/doc parameters default to the real globals and exist so the spec
 * can inject fakes — jsdom's getBoundingClientRect returns all-zero rects,
 * so a fake document keeps the wrapper's tests meaningful without a layout
 * engine. Rects are viewport-relative in the browser, so the fake must
 * return tops with scrollY already subtracted (same as the real caller).
 *
 * @param {{ sectionIds: string[], pathname: string,
 *           win?: { scrollY: number, innerHeight: number },
 *           doc?: { documentElement: { scrollHeight: number },
 *                   getElementById: (id: string) => { getBoundingClientRect:
 *                     () => { top: number } } | null } }} input
 * @returns {string | null} active section id
 */
export function pickOnViewport({ sectionIds, pathname, win = window, doc = document }) {
  if (pathname === '/contact') return 'contact';
  if (pathname !== '/') return null;
  return pickActiveSection({
    sectionIds,
    scrollY: win.scrollY,
    viewportH: win.innerHeight,
    docHeight: doc.documentElement.scrollHeight,
    getTop: (id) => {
      const el = doc.getElementById(id);
      return el ? el.getBoundingClientRect().top : null;
    },
  });
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

/**
 * Defer a callback until after the next paint (two requestAnimationFrame ticks).
 * The mobile menu releases the body scroll-lock when unmounted, so restoring
 * focus to the toggle or performing a section scroll must wait two frames for
 * layout and the body lock release to settle.
 *
 * @param {() => void} fn — the callback to run after the next paint
 * @returns {() => void} cancel handle
 */
export function deferToNextPaint(fn) {
  let firstId = null;
  let secondId = null;
  firstId = requestAnimationFrame(() => {
    firstId = null;
    secondId = requestAnimationFrame(() => {
      secondId = null;
      fn();
    });
  });
  return () => {
    if (firstId != null) cancelAnimationFrame(firstId);
    if (secondId != null) cancelAnimationFrame(secondId);
    firstId = null;
    secondId = null;
  };
}
