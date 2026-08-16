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
// The app-lifetime watch started by initAOS on capable devices (module-level
// so it can be torn down in tests / HMR without leaving orphan listeners).
let failsafeCleanup = null;

export function initAOS() {
  const gated = aosDisabled();
  if (document.body) {
    document.body.classList.toggle('aos-disabled', gated);
  }
  AOS.init({ once: true, disable: gated });
  // Capable devices are guarded by the viewport failsafe (AOS JS can break
  // or miss an element — content must never stay hidden). Gated devices are
  // already covered by the body.aos-disabled CSS net, which force-shows
  // everything, so the JS watch would be redundant there.
  failsafeCleanup?.();
  failsafeCleanup = gated ? null : startAosFailsafe();
  return gated;
}

// Teardown for the watch initAOS started (specs / HMR).
export function stopAosFailsafe() {
  failsafeCleanup?.();
  failsafeCleanup = null;
}

// --- AOS failsafe -----------------------------------------------------------
//
// The gate net above covers gated devices, but on a CAPABLE device the only
// thing that ever reveals [data-aos] content is AOS's own scroll observer.
// If AOS's JS breaks, throws, or misses an element (a race with a lazy
// chunk's MutationObserver), visible content can stay opacity:0 forever.
//
// This backstop is the scroll-into-view equivalent the site already has for
// gated devices: whenever a [data-aos] element is inside the viewport and
// still lacks .aos-animate, force-show it. It only touches what is actually
// on screen, so below-the-fold scroll reveals are untouched when AOS works,
// and nothing can remain hidden when AOS doesn't.

// Pure decision: should this element be force-shown right now? (In the
// viewport, carries data-aos, and AOS never revealed it.)
export function shouldForceShowAos(el, viewportHeight = window.innerHeight) {
  if (!el || el.classList.contains('aos-animate') || !el.hasAttribute('data-aos')) return false;
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.top < viewportHeight;
}

// Pure list: every [data-aos] element in the viewport that AOS left hidden.
export function stuckAosInView(viewportHeight = window.innerHeight) {
  if (typeof document === 'undefined') return [];
  return Array.from(document.querySelectorAll('[data-aos]')).filter((el) =>
    shouldForceShowAos(el, viewportHeight),
  );
}

/**
 * Start the failsafe watch: on scroll/resize (rAF-throttled, passive), force
 * .aos-animate onto any in-view [data-aos] element AOS left hidden. Returns a
 * cleanup handle. The initial run covers elements already in view at boot.
 */
export function startAosFailsafe() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return () => {};

  let rafId = 0;
  const forceShow = () => {
    stuckAosInView().forEach((el) => el.classList.add('aos-animate'));
  };
  const schedule = () => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = 0;
      forceShow();
    });
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  forceShow(); // elements already in the viewport at boot

  return () => {
    if (rafId) cancelAnimationFrame(rafId);
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
  };
}
