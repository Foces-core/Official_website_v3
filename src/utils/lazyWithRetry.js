import { lazy } from 'react';

/**
 * Lazy load components with automatic chunk load failure recovery.
 * Handles network glitches or stale deployment asset hashes gracefully by retrying,
 * and if that fails, performs a one-time clean page reload.
 */
export function lazyWithRetry(componentImport) {
  return lazy(async () => {
    const pageAlreadyReloaded = window.sessionStorage.getItem('chunk-reload-retry');
    try {
      const component = await componentImport();
      // On success, reset the retry flag so future deployments can reload if needed
      window.sessionStorage.removeItem('chunk-reload-retry');
      return component;
    } catch (error) {
      if (!pageAlreadyReloaded) {
        window.sessionStorage.setItem('chunk-reload-retry', 'true');
        window.location.reload();
      }
      throw error;
    }
  });
}

export default lazyWithRetry;
