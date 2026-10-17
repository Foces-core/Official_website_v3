import { useEffect } from 'react';
import {
  scheduleErrorAutoReload,
  shouldEscalateToCacheRecovery,
  markCacheRecoveryDone,
  isOffline,
} from '../utils/errorRecoveryLogic.js';
import { purgeAppCaches, unregisterServiceWorkers } from '../utils/cacheRecovery.js';

/**
 * usePersistentErrorRecovery — the full-page fallback's recovery policy.
 *
 * First error in a session: one free auto-reload (errorRecoveryLogic's
 * session-flag guard prevents loops). Second error means the reload replayed
 * a poisoned state (stale SW precache / cached HTML-as-JS chunk): escalate —
 * purge every cache, drop the controlling service worker, reload clean.
 * Bounded by the escalation flag: at most one free reload + one recovery
 * reload per session, then the screen stays put for the user to act on.
 *
 * @param {{ delayMs?: number }} [options]
 */
export default function usePersistentErrorRecovery({ delayMs = 1200 } = {}) {
  useEffect(() => {
    let cancelled = false;
    let cancelScheduledReload = () => {};
    let reloadScheduled = false;

    const cancelPendingReload = () => {
      if (!reloadScheduled) return;
      cancelScheduledReload();
      cancelScheduledReload = () => {};
      reloadScheduled = false;
    };

    const onOffline = () => cancelPendingReload();

    const recover = () => {
      if (cancelled || isOffline() || reloadScheduled) return;
      if (shouldEscalateToCacheRecovery()) {
        // Persist the one-shot guard before destructive cleanup. If storage is
        // unavailable, leave the fallback in place rather than risk a loop.
        if (!markCacheRecoveryDone()) return;
        (async () => {
          await purgeAppCaches();
          if (isOffline()) return;
          await unregisterServiceWorkers();
          if (!cancelled && !isOffline()) window.location.reload();
        })().catch(() => {
          // Recovery is best-effort: a failed purge must not become an
          // unhandled rejection.
        });
        return;
      }
      reloadScheduled = true;
      cancelScheduledReload = scheduleErrorAutoReload({ delayMs });
    };

    window.addEventListener('online', recover);
    window.addEventListener('offline', onOffline);
    recover();

    return () => {
      cancelled = true;
      cancelPendingReload();
      window.removeEventListener('online', recover);
      window.removeEventListener('offline', onOffline);
    };
  }, [delayMs]);
}
