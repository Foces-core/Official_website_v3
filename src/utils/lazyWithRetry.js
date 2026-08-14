import { lazy } from 'react';

// sessionStorage can throw (privacy mode, blocked storage). The recovery
// pipeline must never crash on storage access — the retry flag is a
// nice-to-have guard against reload loops, not a hard dependency.
function storageGet(key) {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageRemove(key) {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function storageSet(key, value) {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

/**
 * Lazy load components with automatic chunk load failure recovery.
 * Handles network glitches or stale deployment asset hashes gracefully by retrying,
 * and if that fails, performs a one-time clean page reload.
 */
export function lazyWithRetry(componentImport) {
  return lazy(async () => {
    const pageAlreadyReloaded = storageGet('chunk-reload-retry');
    try {
      const component = await componentImport();
      // On success, reset the retry flag so future deployments can reload if needed
      storageRemove('chunk-reload-retry');
      return component;
    } catch {
      // Retry once after a brief 300ms pause to recover from transient network drops
      try {
        await new Promise((resolve) => setTimeout(resolve, 300));
        const component = await componentImport();
        storageRemove('chunk-reload-retry');
        return component;
      } catch (retryError) {
        if (!pageAlreadyReloaded) {
          storageSet('chunk-reload-retry', 'true');
          window.location.reload();
        }
        throw retryError;
      }
    }
  });
}
