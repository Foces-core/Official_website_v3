import { safeSessionGet, safeSessionSet, safeSessionRemove } from './safeStorage.js';

export const AUTO_RELOAD_KEY = 'foces:error-auto-reloaded';
export const CHUNK_RETRY_KEY = 'chunk-reload-retry';

/**
 * True only when the browser explicitly reports offline. A reload without a
 * connection can never fix a failed chunk or a crashed render — it just
 * flashes the boot splash and replays the same failure (measured: an offline
 * lazy-chunk failure blanked the whole page behind the root error fallback).
 * Gated recoveries become silent no-ops offline and leave their session flags
 * untouched, so a later ONLINE failure still gets its one recovery reload.
 *
 * Unknown state (SSR, jsdom, browsers without navigator.onLine) counts as
 * online: only an explicit `false` suppresses the reload.
 *
 * @param {Window | null} [win]
 * @returns {boolean}
 */
export function isOffline(win = typeof window !== 'undefined' ? window : null) {
  return win?.navigator?.onLine === false;
}

/**
 * Decide whether the Error Boundary fallback should attempt an automatic page reload.
 * Prevents reload loops by verifying that an auto-reload has not already been attempted in this session.
 *
 * @param {{ storage?: Storage | null }} [options]
 * @returns {boolean}
 */
export function shouldAutoReloadOnError({ storage } = {}) {
  return safeSessionGet(AUTO_RELOAD_KEY, null, storage) !== '1';
}

/**
 * Schedules a one-time auto-reload on unexpected runtime error (e.g. iOS WebGL context loss).
 * Marks the session flag and arms a timeout. Returns a cleanup handle.
 *
 * @param {{
 *   storage?: Storage | null,
 *   win?: Window | null,
 *   delayMs?: number,
 *   reloadFn?: () => void
 * }} [options]
 * @returns {() => void} cancel handle
 */
export function scheduleErrorAutoReload({
  storage,
  win = typeof window !== 'undefined' ? window : null,
  delayMs = 1200,
  reloadFn,
} = {}) {
  if (isOffline(win)) return () => {};
  if (!shouldAutoReloadOnError({ storage })) {
    return () => {};
  }

  safeSessionSet(AUTO_RELOAD_KEY, '1', storage);

  const doReload =
    reloadFn ||
    (() => {
      if (win && win.location && typeof win.location.reload === 'function') {
        win.location.reload();
      }
    });

  const timer = setTimeout(doReload, delayMs);
  return () => clearTimeout(timer);
}

/**
 * Resets the error auto-reload session flag.
 *
 * @param {{ storage?: Storage | null }} [options]
 */
export function resetErrorAutoReload({ storage } = {}) {
  safeSessionRemove(AUTO_RELOAD_KEY, storage);
}

/**
 * Checks if a lazy chunk failure has already triggered a reload in this session.
 *
 * @param {{ storage?: Storage | null }} [options]
 * @returns {boolean}
 */
export function hasLazyChunkReloaded({ storage } = {}) {
  return safeSessionGet(CHUNK_RETRY_KEY, null, storage) === 'true';
}

/**
 * Records that a chunk reload is being initiated and executes the reload.
 *
 * @param {{
 *   storage?: Storage | null,
 *   win?: Window | null,
 *   reloadFn?: () => void
 * }} [options]
 */
export function recordLazyChunkReload({
  storage,
  win = typeof window !== 'undefined' ? window : null,
  reloadFn,
} = {}) {
  if (isOffline(win)) return;
  safeSessionSet(CHUNK_RETRY_KEY, 'true', storage);
  const doReload =
    reloadFn ||
    (() => {
      if (win && win.location && typeof win.location.reload === 'function') {
        win.location.reload();
      }
    });
  doReload();
}

/**
 * Clears the chunk retry flag on successful module import.
 *
 * @param {{ storage?: Storage | null }} [options]
 */
export function clearLazyChunkRetry({ storage } = {}) {
  safeSessionRemove(CHUNK_RETRY_KEY, storage);
}
