import { isChunkError } from './chunkRecovery.js';

// Recovery helpers for the full-page error fallback (ErrorFallback.jsx).
// When a missing hashed chunk is served the SPA index.html fallback as
// HTML-as-JS and that response gets cached, refresh + home navigation replay
// the same failure from cache forever. These primitives let the fallback
// offer a real escape hatch: purge the poisoned caches, drop the controlling
// service worker, and reload clean. Every helper is zero-throw and takes its
// browser globals as injectable args so jsdom specs can drive them.

function hashString(value) {
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) + hash + value.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36).toUpperCase().padStart(7, '0').slice(-6);
}

/**
 * Short stable support code for an error (e.g. "CHUNK-9F3K2A").
 * Chunk-like failures (deploy skew, stale SW) get the CHUNK prefix so support
 * can tell "clear your cache" cases from genuine APP crashes without seeing
 * the full message. Pure and total — null-safe.
 *
 * @param {unknown} error
 * @returns {string}
 */
export function getErrorCode(error) {
  const message = error?.message || (typeof error === 'string' ? error : '');
  const name = error?.name || 'Error';
  const prefix = isChunkError(error) ? 'CHUNK' : 'APP';
  return `${prefix}-${hashString(`${name}:${message}`)}`;
}

/**
 * Delete every CacheStorage entry for this origin (poisoned chunk cache,
 * precache, images). The service worker repopulates on next load, so the
 * worst case is re-downloading — never data loss.
 *
 * @param {{ caches?: CacheStorage | null }} [options]
 * @returns {Promise<number>} number of caches deleted
 */
export async function purgeAppCaches({ caches: cacheStorage } = {}) {
  try {
    const target = cacheStorage || (typeof caches !== 'undefined' ? caches : null);
    if (!target || typeof target.keys !== 'function') return 0;
    const keys = await target.keys();
    const results = await Promise.all(keys.map((key) => target.delete(key).catch(() => false)));
    return results.filter(Boolean).length;
  } catch {
    return 0;
  }
}

/**
 * Unregister every service worker controlling this origin so the next load
 * is served fresh from the network instead of a stale precache.
 *
 * @param {{ worker?: ServiceWorkerContainer | null }} [options]
 * @returns {Promise<number>} number of registrations removed
 */
export async function unregisterServiceWorkers({ worker } = {}) {
  try {
    const container = worker || (typeof navigator !== 'undefined' ? navigator.serviceWorker : null);
    if (!container || typeof container.getRegistrations !== 'function') return 0;
    const registrations = await container.getRegistrations();
    const results = await Promise.all(
      registrations.map((registration) => {
        try {
          return registration.unregister();
        } catch {
          return false;
        }
      }),
    );
    return results.filter(Boolean).length;
  } catch {
    return 0;
  }
}
