// Viewport breakpoint hygiene — single source of truth for the width
// thresholds that used to be magic literals across the codebase.
//
// These MUST stay in lockstep with the CSS media queries in
// src/utils/detectProfile.js and the Tailwind arbitrary variants sprinkled
// through the JSX — Tailwind classes can't import this module, so the
// boundary values here are the canonical numbers the classes mirror.
export const SMALL_SCREEN_MAX = 500;
export const MOBILE_MAX = 767;
export const DESKTOP_MIN = 768;

export function isSmallScreen(width) {
  return width < SMALL_SCREEN_MAX;
}

export function isMobileViewport(width) {
  return width <= MOBILE_MAX;
}

export function isDesktopViewport(width) {
  return width >= DESKTOP_MIN;
}

export const WIDE_SCREEN_MIN = 1024;
export function isWideScreen(width) {
  return width >= WIDE_SCREEN_MIN;
}

// ECHO carousel column policy (Featuring): 1 slide under 500px, 2 up to
// 750px, 3 beyond. The breakpoint is exported too so the responsive sizes
// string in Featuring.jsx matches the column count exactly (a mismatch makes
// the images render wider than their slide and bleed toward the page edge).
export const FEATURING_2COL_MAX = 750;
export function featuringSlidesPerView(width) {
  if (width < SMALL_SCREEN_MAX) return 1;
  if (width < FEATURING_2COL_MAX) return 2;
  return 3;
}

// Team carousel (Execom) column policy — flat desktop mode only; cube mode
// is always 1. Derived from the same breakpoint constants. Exported so the
// responsive sizes string in TeamCarousel matches the column count and
// section width exactly (a mismatch makes the edge cards render wider than
// their slide and bleed under the nav arrows).
export const TEAM_WIDE_MIN = 1280;
export const TEAM_3COL_MIN = 1024;
export const TEAM_2COL_MIN = 640;
export function teamSlidesPerView(width) {
  if (width >= TEAM_WIDE_MIN) return 4;
  if (width >= TEAM_3COL_MIN) return 3;
  if (width >= TEAM_2COL_MIN) return 2;
  return 1;
}

// Team carousel gap — wider at 3+ columns, tighter at 2.
export function teamGap(width) {
  return width >= TEAM_3COL_MIN ? 24 : 20;
}
