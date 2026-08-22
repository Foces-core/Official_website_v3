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
//
// This module is the pure-decision owner (ADR-0009): gating, init policy and
// the viewport failsafe *decisions* live here. The failsafe's browser
// lifecycle (listeners, rAF, cleanup) lives in the useAosFailsafe hook, which
// is mounted once in App.
import detectProfile from './detectProfile.js';
import { resolveExperienceCapabilities } from './experienceTier.js';
import AOS from 'aos';

export function aosDisabled() {
  if (typeof window === 'undefined') return false;
  // The reducedMotion || lowPower dialect lives in the experience-tier
  // matrix — aosReveals is the capability (full tier only).
  return !resolveExperienceCapabilities(detectProfile()).aosReveals;
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
  // AOS.init must never take the app down: if it throws at module scope the
  // whole page would fail to boot. On capable devices the viewport failsafe
  // (useAosFailsafe) force-shows in-view content anyway; on gated devices the
  // body.aos-disabled CSS net covers everything.
  try {
    AOS.init({ once: true, disable: gated });
  } catch (error) {
    console.error('AOS initialization failed; the viewport failsafe will cover reveals.', error);
  }
  return gated;
}

// --- AOS failsafe decisions ------------------------------------------------
//
// The gate net above covers gated devices, but on a CAPABLE device the only
// thing that ever reveals [data-aos] content is AOS's own scroll observer.
// If AOS's JS breaks, throws, or misses an element (a race with a lazy
// chunk's MutationObserver), visible content can stay opacity:0 forever.
//
// The backstop (started by the useAosFailsafe hook) is the scroll-into-view
// equivalent the site already has for gated devices: whenever a [data-aos]
// element is inside the viewport and still lacks .aos-animate, force-show it.
// It only touches what is actually on screen, so below-the-fold scroll
// reveals are untouched when AOS works, and nothing can remain hidden when
// AOS doesn't. The *decisions* are pure — no DOM listeners or lifecycle here.

// Pure decision: should this element be force-shown right now? (In the
// viewport, carries data-aos, and AOS never revealed it.)
export function shouldForceShowAos(el, viewportHeight) {
  if (!el || el.classList.contains('aos-animate') || !el.hasAttribute('data-aos')) return false;
  // Resolve the viewport height only after the element guards, so a
  // server-side call (no window) returns false instead of throwing.
  const height = viewportHeight ?? (typeof window === 'undefined' ? 0 : window.innerHeight);
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.top < height;
}

// Pure list: every [data-aos] element in the viewport that AOS left hidden.
export function stuckAosInView(viewportHeight) {
  if (typeof document === 'undefined') return [];
  return Array.from(document.querySelectorAll('[data-aos]')).filter((el) =>
    shouldForceShowAos(el, viewportHeight),
  );
}
