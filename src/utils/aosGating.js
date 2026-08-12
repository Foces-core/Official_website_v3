// AOS reveal animations are disabled for users who asked for no motion AND
// for low-end devices (slow network / few cores / low RAM) where transform
// reveals on scroll cause visible jank. Capable machines get the reveals.
//
// The device heuristics themselves live in detectProfile.js — they must not
// be re-implemented here a second time (that was the old bug: aosGating had
// its own copy of the network/CPU checks and read prefers-reduced-motion
// directly, so the ?motion=on/off and ?perf=slow/high overrides never
// reached AOS). This module only applies the profile + the motion override.
import detectProfile from './detectProfile.js';

export function aosDisabled() {
  if (typeof window === 'undefined') return false;

  const profile = detectProfile();

  // Explicit overrides win: ?motion=on forces reveals even when the OS asks
  // for reduced motion; ?motion=off / ?perf=slow force them off. ?perf=high
  // still respects the OS preference via detectReducedMotion().
  try {
    const motion = new URLSearchParams(window.location.search).get('motion');
    if (motion === 'on') return false;
    if (motion === 'off') return true;
  } catch {
    // ignore — malformed URL
  }

  return profile.reducedMotion || profile.lowPower;
}
