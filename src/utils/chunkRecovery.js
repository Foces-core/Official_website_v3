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
  return /Loading chunk|Loading CSS chunk|ChunkLoadError|Failed to fetch dynamically imported module|Importing a module script failed/.test(
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
