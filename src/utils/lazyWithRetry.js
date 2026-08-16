import { lazy } from 'react';
import {
  hasLazyChunkReloaded,
  recordLazyChunkReload,
  clearLazyChunkRetry,
} from './errorRecoveryLogic.js';

/**
 * Lazy load components with automatic chunk load failure recovery.
 * Handles network glitches or stale deployment asset hashes gracefully by retrying,
 * and if that fails, performs a one-time clean page reload.
 */
export function lazyWithRetry(componentImport) {
  return lazy(async () => {
    const pageAlreadyReloaded = hasLazyChunkReloaded();
    try {
      const component = await componentImport();
      // On success, reset the retry flag so future deployments can reload if needed
      clearLazyChunkRetry();
      return component;
    } catch {
      // Retry once after a brief 300ms pause to recover from transient network drops
      try {
        await new Promise((resolve) => setTimeout(resolve, 300));
        const component = await componentImport();
        clearLazyChunkRetry();
        return component;
      } catch (retryError) {
        if (!pageAlreadyReloaded) {
          recordLazyChunkReload();
        }
        throw retryError;
      }
    }
  });
}
