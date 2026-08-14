// Celebration policies for the About cube easter egg — pure logic, no React.
//
// easterEggLogic.js owns the DETECTION (when a rapid-spin burst fires);
// this module owns what happens when it does: the no-repeat message pick,
// the capped toast-stack insertion, and the drag-velocity EMA that feeds
// the wind-down feel. All three used to live inline in AboutUs.jsx, where
// every tweak risked the celebration with no test to catch it.
export const TOAST_MS = 1700; // must outlast the .about-toast animation (1.6s)
export const MAX_TOASTS = 4; // cap concurrent toasts during a rapid-fire session

// Pick a celebration message, never repeating the one just shown. `rand`
// must return an integer index in [0, messages.length) (the caller wraps
// Math.random the same way the component used to). A single-message list is
// returned as-is so the guard never loops forever.
export function pickEasterMessage(last, messages, rand) {
  if (messages.length <= 1) return messages[0];
  let msg;
  do {
    msg = messages[rand()];
  } while (msg === last);
  return msg;
}

// Append a toast to the stack, dropping the OLDEST first once the stack is
// at capacity, so a rapid-fire session piles upward instead of overlapping.
// Returns the new element so the caller can schedule its removal.
export function pushToast(stack, text, maxToasts = MAX_TOASTS) {
  while (stack.children.length >= maxToasts) {
    stack.firstChild.remove();
  }
  const toast = document.createElement('div');
  toast.className = 'about-toast';
  toast.textContent = text;
  stack.appendChild(toast);
  return toast;
}

// Exponential moving average of drag velocity (deg/ms). The instantaneous
// rate (deg / ms since the last move) is smoothed against the previous
// velocity by factor `k` — same math AboutUs.jsx applied inline.
export function emaVelocity(prev, delta, dt = 1, k = 0.4) {
  const safeDt = Math.max(dt, 1);
  return prev * (1 - k) + (delta / safeDt) * k;
}
