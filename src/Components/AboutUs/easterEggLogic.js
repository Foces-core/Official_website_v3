// Spin-tracking for the About cube easter egg — pure logic, no React.
//
// A "spin" is one 90° of Y rotation. The egg fires after `target` spins
// arrive within `gap` ms of each other; a gap longer than that resets the
// counter, so only deliberate rapid spinning counts — wind-down inertia and
// casual rotating never fire it.
//
// Touch-first phones get an easier bar: fewer spins + a wider gap, because
// every spin costs real finger travel on a small cube. The DOM read (the
// (pointer: coarse) media query) stays in AboutUs.jsx; the policy pick lives
// here (spinConfigFor) — it is an input-kind heuristic, not a perf heuristic
// (the perf ones stay in detectProfile).
export const SPIN_BARS = {
  touch: { target: 8, gap: 1500 },
  desktop: { target: 20, gap: 800 },
};

// Which spin bar applies for a device: coarse pointers (touch-first phones)
// get the easier bar. Pure — the component feeds it the media-query boolean.
export function spinConfigFor(coarse) {
  return coarse ? SPIN_BARS.touch : SPIN_BARS.desktop;
}

export function createSpinTracker({ target, gap }) {
  let count = 0;
  let last = 0;

  return {
    // Record one spin; returns true exactly when the rapid-spin threshold is
    // hit. Fires at most once per burst — the count resets on fire.
    register(now = Date.now()) {
      count = now - last > gap ? 1 : count + 1;
      last = now;
      if (count >= target) {
        count = 0;
        return true;
      }
      return false;
    },
  };
}
