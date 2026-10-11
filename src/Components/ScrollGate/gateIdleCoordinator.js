/**
 * Client coordinator for ScrollGate idle-arm prerendering.
 *
 * After load, during browser idle, arm exactly ONE deferred gate so the next
 * section's chunk downloads ahead of the first scroll — the first interaction
 * (scroll/nav tap) then renders instantly. Subsequent gates stay deferred to
 * preserve the boot budget (ADR-0002: app-shell only) and to keep idle CPU off
 * the first-interaction path.
 *
 * Pure bookkeeping module (ADR-0009): the component imports register/armArm
 * functions; decisions come from scrollGateLogic.nextGateToArmAtIdle.
 */
import { nextGateToArmAtIdle } from './scrollGateLogic.js';

/** @type {Map<string, () => void>} gate id -> arm callback (also = mounted? noop) */
const pending = new Map();
let idleScheduled = false;
let loadDone = false;

/**
 * Register a still-deferred gate. Called by ScrollGate on mount; the armed
 * (or mounted) gate removes itself via unregister().
 * @param {string} id
 * @param {() => void} arm — component callback that mounts the section
 */
export function registerDeferredGate(id, arm) {
  pending.set(id, arm);
  if (loadDone) scheduleIdleArm();
}

export function unregisterDeferredGate(id) {
  pending.delete(id);
}

/** Called once per page after window 'load'. */
export function notifyLoadDone() {
  if (loadDone) return;
  loadDone = true;
  scheduleIdleArm();
}

/** Test/reset hook. */
export function resetGateCoordinator() {
  pending.clear();
  idleScheduled = false;
  loadDone = false;
}

function scheduleIdleArm() {
  if (idleScheduled) return;
  idleScheduled = true;
  const win = typeof window !== 'undefined' ? window : null;
  if (!win) return;

  const armNext = () => {
    idleScheduled = false;
    // Ask the coordinating component for the current gate order/tops; if the
    // host page didn't wire a provider, fall back to first-registered.
    const snapshot = takeSnapshot();
    let target;
    if (snapshot && snapshot.ids.length > 1) {
      target = nextGateToArmAtIdle(snapshot);
    } else {
      target = pending.keys().next().value ?? null;
    }
    if (target == null) return;
    const arm = pending.get(target);
    if (typeof arm === 'function') {
      pending.delete(target);
      arm();
    }
  };

  const delay = 1500; // well after 'load'; keep off the LCP path
  let timer = setTimeout(() => {
    timer = null;
    if (typeof win.requestIdleCallback === 'function') {
      win.requestIdleCallback(armNext, { timeout: 4000 });
    } else {
      armNext();
    }
  }, delay);
  // If a scroll begins before the idle arm fires, abort the arm: the real
  // interaction path takes over and prerolling is no longer "idle".
  const abortOnFirstScroll = () => {
    if (timer != null) {
      clearTimeout(timer);
      timer = null;
      idleScheduled = false;
      window.removeEventListener('scroll', abortOnFirstScroll);
    }
  };
  window.addEventListener('scroll', abortOnFirstScroll, { passive: true, once: true });
}

// Optional host-page provider: a page can register a snapshot function so the
// coordinator knows DOM order and positions (weak default = registration order).
let snapshotProvider = null;
export function setGateSnapshotProvider(fn) {
  snapshotProvider = typeof fn === 'function' ? fn : null;
}
function takeSnapshot() {
  if (!snapshotProvider) return null;
  try {
    return snapshotProvider();
  } catch {
    return null;
  }
}
