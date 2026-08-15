// iOS/WebKit suspends backgrounded tabs: timers freeze and the GPU reclaims
// WebGL contexts. Returning to a tab that sat in the background too long can
// surface a crashed, non-refreshing page (the old "Something went wrong"
// fallback with nobody to reload it). The guard: if the tab was hidden past
// a threshold, hard-reload on resume instead of showing the stale/broken
// state. Cheap — the app shell is ~370KB and the service worker serves it.
//
// 120s: short app-switches (checking a message, camera) stay untouched;
// anything longer gets a fresh page. Tunable per call via thresholdMs.
export const PAGE_RESUME_RELOAD_MS = 120_000;

/**
 * Should the page reload now that it's visible again?
 * @param {{ hiddenAt: number|null|undefined, visibleAt: number,
 *           thresholdMs?: number }} args
 * @returns {boolean}
 */
export function shouldReloadOnResume({ hiddenAt, visibleAt, thresholdMs = PAGE_RESUME_RELOAD_MS }) {
  if (typeof hiddenAt !== 'number' || typeof visibleAt !== 'number') return false;
  if (hiddenAt < 0 || visibleAt < hiddenAt) return false;
  return visibleAt - hiddenAt >= thresholdMs;
}
