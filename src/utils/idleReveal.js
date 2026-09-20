// Pure decision for pointer-idle UI reveals (e.g. carousel nav arrows):
// controls stay visible while the user is active, then hide once the area
// has been idle past the threshold. The wiring hook (useIdleReveal) feeds
// pointer/key/focus activity in as `lastActivityAt`; this module only
// decides. Deletion test: delete this, and the hide timing scatters as a
// magic number inside the carousel component.

export const DEFAULT_IDLE_REVEAL_MS = 2500;

/**
 * True while the controls should stay visible (area recently active, or the
 * inputs are unusable — fail open so controls are never stuck hidden).
 *
 * @param {{
 *   lastActivityAt?: number,
 *   now?: number,
 *   idleMs?: number,
 * }} params
 * @returns {boolean}
 */
export function shouldShowIdleReveal({ lastActivityAt, now, idleMs = DEFAULT_IDLE_REVEAL_MS }) {
  if (!Number.isFinite(lastActivityAt) || !Number.isFinite(now)) return true;
  if (!Number.isFinite(idleMs) || idleMs <= 0) return true;
  return now - lastActivityAt < idleMs;
}
