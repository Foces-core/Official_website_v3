import {
  hasLazyChunkReloaded,
  recordLazyChunkReload,
  clearLazyChunkRetry,
  shouldAutoReloadOnError,
} from './errorRecoveryLogic.js';

// Deep chunkRecovery — single seam for stale chunk handling.
// Deletion test: delete this module, lazyWithRetry scatters retry + reload
// flag handling + Sentry filtering across 3 files.

export function isChunkError(error) {
  const msg = error?.message || (typeof error === 'string' ? error : '');
  // The last four alternatives are the HTML-as-JS signature: when a missing
  // hashed chunk gets the SPA index.html fallback (200 text/html) instead of
  // a 404, the module loader throws a SyntaxError/MIME error rather than a
  // classic chunk message. Treating them as chunk errors routes them into
  // the retry + one-shot reload recovery instead of the static fallback.
  return /Loading chunk|Loading CSS chunk|ChunkLoadError|Failed to fetch dynamically imported module|Importing a module script failed|Failed to load module script|Expected a JavaScript|MIME type|text\/html|Unexpected token ['"]?</.test(
    msg,
  );
}

export function createChunkRecovery({ storage, win } = {}) {
  return {
    hasReloaded: () => hasLazyChunkReloaded({ storage }),
    recordReload: () => recordLazyChunkReload({ storage, win }),
    clear: () => clearLazyChunkRetry({ storage }),
    shouldAutoReload: () => shouldAutoReloadOnError({ storage }),
    isChunkError,
  };
}

// Thin helper for lazyWithRetry to use — keeps CC low
export async function tryImportWithRetry(importFn, hasReloaded) {
  try {
    const mod = await importFn();
    clearLazyChunkRetry();
    return mod;
  } catch {
    try {
      await new Promise((r) => setTimeout(r, 300));
      const mod = await importFn();
      clearLazyChunkRetry();
      return mod;
    } catch (retryError) {
      if (!hasReloaded) recordLazyChunkReload();
      throw retryError;
    }
  }
}
