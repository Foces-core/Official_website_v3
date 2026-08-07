// Arrow-key arbitration for every keyboard-driven widget on the page
// (About cube + the Featuring/Execom carousels). Rules, in priority order:
//   1. While a focusable control (nav link / button / input) has focus, it
//      owns the keys — no widget reacts.
//   2. Among the widgets currently ON SCREEN, the one the user interacted
//      with most recently owns the keys. Pointer use (drag/click) or
//      arrow-key use marks a widget; autoplay and programmatic slides never
//      mark.
//   3. Tie-break (nothing interacted yet): the first-registered on-screen
//      widget wins — registration order is page order, so the cube by default.
// Tiny module-level store — no React state, no re-renders.

const widgets = new Map(); // id -> { isOnScreen: () => boolean }
const interactedAt = new Map(); // id -> timestamp
const listeners = new Set();
let controlFocused = false;
let notifyRaf = null;

function notify() {
  listeners.forEach((fn) => fn());
}

// Register a widget that competes for the arrow keys. `isOnScreen` is called
// lazily on every ownership query. Returns an unregister function.
export function registerWidget(id, isOnScreen) {
  widgets.set(id, { isOnScreen });
  notify();
  return () => {
    widgets.delete(id);
    interactedAt.delete(id);
    notify();
  };
}

// Mark a widget as the one the user just interacted with. It keeps ownership
// of the arrow keys as long as it stays on screen.
export function markInteracted(id) {
  interactedAt.set(id, Date.now());
  notify();
}

// Which widget currently owns the arrow keys, or null (a control has focus,
// or nothing is on screen).
export function getArrowOwner() {
  if (controlFocused) return null;
  let best = null;
  let bestT = -1;
  for (const [id, w] of widgets) {
    if (!w.isOnScreen()) continue;
    const t = interactedAt.get(id) ?? 0;
    if (t > bestT) {
      best = id;
      bestT = t;
    }
  }
  return best;
}

// True while focus is on an interactive control (link/button/input/...).
// Arrow keys on those controls drive the control, not the page widgets.
export function isControlFocused() {
  return controlFocused;
}

export function subscribeKeyboardArbitration(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Carousels call this whenever ownership may have changed (focus, scroll,
// interaction) to enable/disable their Swiper keyboard.
export function syncCarouselKeyboard(swiper, ownId) {
  if (!swiper?.keyboard) return;
  if (getArrowOwner() === ownId) swiper.keyboard.enable();
  else swiper.keyboard.disable();
}

// True when an element's box intersects the viewport (with an optional
// margin). Used as the "on screen" check for registered widgets.
export function rectIsOnScreen(el, margin = 0) {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  const vw = window.innerWidth || document.documentElement.clientWidth;
  const vh = window.innerHeight || document.documentElement.clientHeight;
  return r.bottom > -margin && r.top < vh + margin && r.right > -margin && r.left < vw + margin;
}

// Keep `controlFocused` in sync, and re-evaluate ownership on scroll so
// carousels enable/disable as widgets enter/leave the viewport.
if (typeof window !== 'undefined') {
  const syncFocus = () => {
    const el = document.activeElement;
    controlFocused = !!(el && el !== document.body && el !== document.documentElement);
    notify();
  };
  const scheduleNotify = () => {
    if (notifyRaf != null) return;
    notifyRaf = requestAnimationFrame(() => {
      notifyRaf = null;
      notify();
    });
  };
  window.addEventListener('focusin', syncFocus);
  window.addEventListener('focusout', syncFocus);
  window.addEventListener('scroll', scheduleNotify, { passive: true });
  syncFocus();
}
