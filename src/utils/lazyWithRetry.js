import { lazy } from 'react';
import { CHUNK_RETRY_KEY, hasLazyChunkReloaded } from './errorRecoveryLogic.js';
import { tryImportWithRetry } from './chunkRecovery.js';

/**
 * Lazy load components with automatic chunk load failure recovery.
 * Delegates to chunkRecovery seam — single place for retry + reload flag.
 */
export function lazyWithRetry(componentImport, chunkId) {
  const retryKey = chunkId ? `${CHUNK_RETRY_KEY}:${chunkId}` : CHUNK_RETRY_KEY;
  return lazy(() =>
    tryImportWithRetry(componentImport, hasLazyChunkReloaded({ key: retryKey }), retryKey),
  );
}
