import { useEffect } from 'react';
import {
  scheduleErrorAutoReload,
  shouldEscalateToCacheRecovery,
  markCacheRecoveryDone,
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
    if (shouldEscalateToCacheRecovery()) {
      markCacheRecoveryDone();
      let cancelled = false;
      (async () => {
        await purgeAppCaches();
        await unregisterServiceWorkers();
        if (!cancelled) window.location.reload();
      })();
      return () => {
        cancelled = true;
      };
    }
    return scheduleErrorAutoReload({ delayMs });
  }, [delayMs]);
}
