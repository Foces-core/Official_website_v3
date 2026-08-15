// Viewport breakpoint hygiene — single source of truth for the width
// thresholds that used to be magic literals in Loader (500), Navbar (767),
// ScrollGate (768), HeroSection (1024) and Featuring (500/750).
//
// These MUST stay in lockstep with the CSS media queries in
// src/utils/detectProfile.js (mobile: max-width 767px, desktop: min-width
// 1024px) and the Tailwind arbitrary variants (max-[767px] / min-[768px])
// sprinkled through the JSX — Tailwind classes can't import this module, so
// the boundary values here are the canonical numbers the classes mirror.
export const SMALL_SCREEN_MAX = 500; // narrow-screen heuristic (Loader tagline, Featuring 1-col)
export const MOBILE_MAX = 767; // <= 767 is a phone viewport (Navbar, matches detectProfile)
export const DESKTOP_MIN = 768; // >= 768 is desktop-ish (ScrollGate height bucket)

// FEATURING_2COL_MAX / WIDE_SCREEN_MIN are internal to the policies below
// (their behavior is pinned through the functions in breakpoints.spec.js).

export function isSmallScreen(width) {
  return width < SMALL_SCREEN_MAX;
}

export function isMobileViewport(width) {
  return width <= MOBILE_MAX;
}

export function isDesktopViewport(width) {
  return width >= DESKTOP_MIN;
}

// Desktop-wide threshold for the Vanta hero (matches detectProfile desktop);
// also feeds the `sizes` media queries in the JSX (Events/EventCard), so the
// number stays in lockstep with the functions and the Tailwind variants.
export const WIDE_SCREEN_MIN = 1024;
export function isWideScreen(width) {
  return width >= WIDE_SCREEN_MIN;
}

// ECHO carousel column policy (Featuring): 1 slide under 500px, 2 up to
// 750px, 3 beyond — the resize handler used to inline this with raw numbers.
const FEATURING_2COL_MAX = 750; // < 750 shows 2 columns (exclusive)
export function featuringSlidesPerView(width) {
  if (width < SMALL_SCREEN_MAX) return 1;
  if (width < FEATURING_2COL_MAX) return 2;
  return 3;
}
