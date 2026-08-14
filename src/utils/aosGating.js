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
import AOS from 'aos';

export function aosDisabled() {
  if (typeof window === 'undefined') return false;
  const profile = detectProfile();
  return profile.reducedMotion || profile.lowPower;
}

// AOS hides [data-aos] elements (opacity/transform) until they scroll into
// view. Init runs at module scope, before React renders, so when the gate is
// active (reduced motion / low-end device) AOS finds no elements to unhide and
// never registers its observer — leaving every [data-aos] element stuck
// invisible. So when gated, <body> is tagged and CSS force-shows all
// [data-aos] content (including anything mounted later, e.g. lazy routes).
// Gate + init live here so the 'aos' dependency and the override handling have
// a single owner (the old second copy of the gate checks lived in App.jsx).
export function initAOS() {
  const gated = aosDisabled();
  if (document.body) {
    document.body.classList.toggle('aos-disabled', gated);
  }
  AOS.init({ once: true, disable: gated });
  return gated;
}
