// The About cube's timing policies — how long a manual action owns the cube
// before the idle auto-spin may resume. These used to be bare `Date.now() +
// N` literals inside AboutUs.jsx, untested, where tuning any of them silently
// changed the feel of the cube. Named here so a tweak is a one-line, spec'd
// change (same shape as CUBE_PHYSICS in cubePhysics.js).

// Pause after settling onto a face so wind-down doesn't immediately resume.
export const SNAP_GRACE_MS = 1200;

// Inertia (wind-down) never interrupts a fresh manual spin for this long.
export const WIND_DOWN_OVERRIDE_MS = 10000;

// Keyboard arrow spins keep the idle auto-spin away for this long.
export const ARROW_SPIN_GRACE_MS = 3000;

// A drag owns the cube for a full minute.
export const DRAG_OVERRIDE_MS = 60000;

/**
 * Is a manual action (drag, arrow spin, wind-down) still in control?
 * The idle auto-spin resumes when this returns false — it replaces the
 * `Date.now() >= manualUntilRef.current` check inline in AboutUs.jsx.
 *
 * @param {number} manualUntil - timestamp when the override expires (0 = never set)
 * @param {number} now - current timestamp
 * @returns {boolean}
 */
export function isManualOverrideActive(manualUntil, now) {
  return now < manualUntil;
}
