import { lazy } from 'react';
import { hasLazyChunkReloaded } from './errorRecoveryLogic.js';
import { tryImportWithRetry } from './chunkRecovery.js';

/**
 * Lazy load components with automatic chunk load failure recovery.
 * Delegates to chunkRecovery seam — single place for retry + reload flag.
 */
export function lazyWithRetry(componentImport) {
  return lazy(() => tryImportWithRetry(componentImport, hasLazyChunkReloaded()));
}
