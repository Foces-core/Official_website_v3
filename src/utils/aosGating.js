// AOS reveal animations are disabled for users who asked for no motion AND
// for low-end devices (slow network / few cores / low RAM) where transform
// reveals on scroll cause visible jank. Capable machines get the reveals.
//
// All device + override heuristics live in detectProfile.js — including the
// ?motion=on/off and ?perf=slow/high URL overrides, which it resolves inside
// detectReducedMotion(). That override parsing must NOT be re-implemented
// here (it was the old bug: a second copy of the checks meant the overrides
// never reached AOS). Precedence when contradictory overrides are both set
// (?perf=slow&motion=on): the perf override wins — it is the "degrade
// everything" hammer, and lowPower is part of its resolved profile.
import detectProfile from './detectProfile.js';

export function aosDisabled() {
  if (typeof window === 'undefined') return false;
  const profile = detectProfile();
  return profile.reducedMotion || profile.lowPower;
}
