// Boot-splash decisions for Root()'s effect in main.jsx — pure, unit-tested.
// The DOM work (classList, remove, the window 'load' listener) stays in the
// component; these are the knobs that make the splash last exactly as long
// as the boot needs and never occlude the page.

// Hard failsafe: a stalled resource must never keep the opaque splash over
// the hero, inflating LCP (measured ~9s occlusion at 4x CPU throttle before
// this was added).
export const SPLASH_FAILSAFE_MS = 1500;

// ADR-0001: slow/low-end devices get no splash at all — it is removed
// immediately, never painted.
export function skipSplash(slowNetwork) {
  return slowNetwork === true;
}

// Resolves right after the first real frame paints (which is what the hero
// content is waiting on) — double-rAF so the paint has actually been
// presented, not merely scheduled.
export function paintReady() {
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}
