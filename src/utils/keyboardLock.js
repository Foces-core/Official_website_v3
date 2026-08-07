// Cross-widget keyboard arbitration: only one keyboard-driven widget reacts
// to the arrow keys at a time. The About cube owns the arrows while it is on
// screen; the Featuring carousel defers (its Swiper keyboard is disabled while
// the cube is active, see Featuring.jsx). Tiny module-level store — no React
// state, no re-renders, works across component boundaries.
let cubeActive = false;
const listeners = new Set();

export function setCubeKeyboardActive(active) {
  if (cubeActive === active) return;
  cubeActive = active;
  listeners.forEach((fn) => fn(active));
}

export function isCubeKeyboardActive() {
  return cubeActive;
}

export function subscribeCubeKeyboard(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
