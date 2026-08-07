// Cross-widget keyboard arbitration: only one keyboard-driven widget reacts
// to the arrow keys at a time.
//  - The About cube owns the arrows while it is on screen; carousels disable
//    their Swiper keyboard during that window (Featuring.jsx, Execom.jsx).
//  - While focus sits on an interactive control (nav links, buttons, inputs)
//    that control owns the keys: the cube ignores those presses and the
//    carousels disable their keyboard too (tracked via focusin/focusout).
// Tiny module-level store — no React state, no re-renders.
let cubeActive = false;
let controlFocused = false;
const listeners = new Set();

function notify() {
  listeners.forEach((fn) => fn(null));
}

export function setCubeKeyboardActive(active) {
  if (cubeActive === active) return;
  cubeActive = active;
  notify();
}

export function isCubeKeyboardActive() {
  return cubeActive;
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

// Shared rule for carousels: yield the arrow keys while the cube is on
// screen or a control (nav link/button/input) has focus. Both carousels
// (Featuring, Execom) call this so a rule change can't drift between them.
export function syncCarouselKeyboard(swiper) {
  if (!swiper?.keyboard) return;
  if (isCubeKeyboardActive() || isControlFocused()) swiper.keyboard.disable();
  else swiper.keyboard.enable();
}

// Keep `controlFocused` in sync with the real focus target. Attached once at
// module load (browser only); the initial call covers browser-restored focus.
if (typeof window !== 'undefined') {
  const sync = () => {
    const el = document.activeElement;
    controlFocused = !!(el && el !== document.body && el !== document.documentElement);
    notify();
  };
  window.addEventListener('focusin', sync);
  window.addEventListener('focusout', sync);
  sync();
}
