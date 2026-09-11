/**
 * Offline-toast decision module (ADR-0009) — pure visibility policy for the
 * global offline indicator.
 *
 * Policy (confirmed with the site owner): notify ONLY while offline. The
 * toast appears on the offline transition (or when the page boots without a
 * connection, e.g. a cached PWA launch) and disappears silently on reconnect
 * — no "back online" fanfare, no nagging while everything works.
 *
 * The transition input is the browser's current onLine value, so the hook
 * stays a one-line state mirror and every branch lives here, unit-spec'd.
 */

/**
 * Next toast visibility from the browser's current online state.
 *
 * @param {boolean} isOnline `navigator.onLine` (or the online/offline event state)
 * @returns {boolean} true only while offline
 */
export function nextOfflineVisible(isOnline) {
  return isOnline === false;
}
