import { resolveWindDown } from './cubePhysics.js';
import { isManualOverrideActive } from './cubeTiming.js';

/**
 * Should the cube enter wind-down inertia after a drag release?
 * Delegates to `resolveWindDown` — `null` means too slow, so snap instead.
 * Pure wrapper so the hook's `endDrag` has CC 1 and is mutation-testable.
 *
 * @param {number} velocity - release velocity in deg/ms (hook's `velY.current`)
 * @returns {boolean} true when a wind-down should start
 */
export function shouldStartWindDown(velocity) {
  const resolved = resolveWindDown(velocity);
  return resolved !== null;
}

/**
 * Horizontal drag displacement in degrees.
 * Pure extraction of the `(clientX - startX) * sensitivity` math that was
 * inline in `moveDrag`. Keeps that callback at CC 2 and isolates the
 * arithmetic for mutation testing (mutants on `*` / `-` are killed by specs).
 *
 * @param {number} clientX - current pointer X (touch or mouse)
 * @param {number} startX - drag-start X
 * @param {number} sensitivity - deg per pixel (`CUBE_PHYSICS.dragSensitivity`)
 * @returns {number} delta in degrees to add to `startRotY`
 */
export function computeDragDelta(clientX, startX, sensitivity) {
  return (clientX - startX) * sensitivity;
}

/**
 * Is the cube idle and eligible for the slow auto-spin?
 * The hook's `animate` used to inline 4 conditions + a timing check; that
 * put CC at 5-6 and hid the policy. Centralising here drops the hook's
 * frame callback to CC 2 and makes each guard independently spec'able.
 *
 * `manualUntil` is the timestamp until which a manual action owns the cube
 * (see `cubeTiming.js`). `now` is injectable for deterministic tests.
 *
 * @param {{ isDragging: boolean, winding: boolean, manualUntil: number|string, visible: boolean, now?: number }} params
 * @returns {boolean}
 */
export function isIdleForAutoSpin({
  isDragging,
  winding,
  manualUntil,
  visible,
  now = Date.now(),
} = {}) {
  const busy = isDragging || winding || !visible;
  if (busy) return false;
  return !isManualOverrideActive(manualUntil ?? 0, now);
}
