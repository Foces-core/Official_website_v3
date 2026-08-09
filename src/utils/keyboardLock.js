// Arrow-key arbitration for every keyboard-driven widget on the page
// (About cube + the Featuring/Execom carousels). Rules, in priority order:
//   1. While a focusable control (nav link / button / input / ...) has focus,
//      it owns the keys — no widget reacts. Controls that live INSIDE a widget
//      (its own prev/next arrows, pagination dots) don't count: they're part
//      of the widget, so clicking them keeps the arrows driving the carousel.
//      Containers that merely received focus from a click (e.g. <main
//      tabIndex="-1">, which browsers focus on any click inside it) are NOT
//      controls and never lock the keys — otherwise one stray click would
//      freeze every widget on the page.
//   2. Among the widgets currently ON SCREEN, the one the user interacted
//      with most recently owns the keys. Pointer use (drag/click) or
//      arrow-key use marks a widget; autoplay and programmatic slides never
//      mark.
//   3. Tie-break (nothing interacted yet): the first-registered on-screen
//      widget wins — registration order is page order, so the cube by default.
// Tiny module-level store — no React state, no re-renders.

const widgets = new Map(); // id -> { isOnScreen: () => boolean, el: Element | null }
const interactedAt = new Map(); // id -> timestamp
const listeners = new Set();
let notifyRaf = null;

function notify() {
  listeners.forEach((fn) => fn());
}

// Register a widget that competes for the arrow keys. `isOnScreen` is called
// lazily on every ownership query. `el` (optional) is the widget's root
// element — used to tell "the user clicked one of the widget's own controls"
// apart from a foreign focused control. Returns an unregister function.
export function registerWidget(id, isOnScreen, el) {
  widgets.set(id, { isOnScreen, el: el || null });
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

// A "control" is an element arrow keys could meaningfully drive (or that we
// shouldn't hijack): links, buttons, form fields, editable text, and any real
// tab stop (tabindex >= 0). Script-only focus targets (tabindex="-1", like
// <main> or the hero) are NOT controls — browsers move focus to them on a
// plain click, and locking the arrow keys on every click would freeze the
// carousels/cube for anyone who clicked anywhere on the page.
function isInteractiveControl(el) {
  if (!el || el === document.body || el === document.documentElement) return false;
  const tag = el.tagName;
  if (
    tag === 'A' ||
    tag === 'BUTTON' ||
    tag === 'INPUT' ||
    tag === 'SELECT' ||
    tag === 'TEXTAREA'
  ) {
    return true;
  }
  if (el.isContentEditable) return true;
  const tabindex = el.getAttribute('tabindex');
  if (tabindex !== null && Number(tabindex) >= 0) return true;
  return false;
}

// Which widget currently owns the arrow keys, or null (a foreign control has
// focus, or nothing is on screen).
export function getArrowOwner() {
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
  if (!best) return null;
  // A focused control outside the winning widget (nav link, input, ...) owns
  // the keys. Controls inside the widget itself don't.
  const active = document.activeElement;
  const el = widgets.get(best)?.el;
  if (isInteractiveControl(active) && !(el && el.contains(active))) return null;
  return best;
}

// True while focus is on an interactive control (link/button/input/...).
// Arrow keys on those controls drive the control, not the page widgets.
export function isControlFocused() {
  return isInteractiveControl(document.activeElement);
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
// margin). Used as the "on screen" check for registered widgets. Hidden
// elements (display: none, e.g. a mobile-only swiper on desktop) have no
// client rects and never count.
export function rectIsOnScreen(el, margin = 0) {
  if (!el) return false;
  if (!el.getClientRects || !el.getClientRects().length) return false;
  const r = el.getBoundingClientRect();
  const vw = window.innerWidth || document.documentElement.clientWidth;
  const vh = window.innerHeight || document.documentElement.clientHeight;
  return r.bottom > -margin && r.top < vh + margin && r.right > -margin && r.left < vw + margin;
}

// Re-evaluate ownership on focus changes (a control gains/loses focus) and on
// scroll, so carousels enable/disable as widgets enter/leave the viewport.
if (typeof window !== 'undefined') {
  const syncFocus = () => notify();
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
}
