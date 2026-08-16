import { useEffect, useCallback } from 'react';
import {
  prefetchRoute,
  scheduleIdlePrefetch,
  initForesightPrefetch,
} from '../utils/routePrefetchLogic.js';

/**
 * Thin React hook wiring route prefetching to the component lifecycle:
 * - Direct intent prefetch handler (hover / focus / touch)
 * - Idle background route preloading (delayed timer)
 * - ForesightJS machine-learning trajectory prediction
 *
 * Gating policy (slowNetwork, Data-Saver, effective connection type)
 * lives in the pure routePrefetchLogic manager (ADR-0009 / ADR-0010).
 *
 * @param {{
 *   slowNetwork?: boolean,
 *   idleDelayMs?: number,
 * }} options
 * @returns {{
 *   handlePrefetch: (id: string) => void
 * }}
 */
export default function useRoutePrefetch({ slowNetwork = false, idleDelayMs = 1200 } = {}) {
  const handlePrefetch = useCallback(
    (id) => {
      prefetchRoute(id, { slowNetwork });
    },
    [slowNetwork],
  );

  // 1. Idle route preloading (pure manager handles network check and timeout)
  useEffect(() => {
    const cancel = scheduleIdlePrefetch({
      delayMs: idleDelayMs,
      slowNetwork,
    });
    return cancel;
  }, [slowNetwork, idleDelayMs]);

  // 2. ForesightJS prediction integration (pure manager handles network check and registration)
  useEffect(() => {
    const cleanup = initForesightPrefetch({
      routeIds: ['events', 'contact'],
      slowNetwork,
      onPrefetch: handlePrefetch,
    });
    return cleanup;
  }, [slowNetwork, handlePrefetch]);

  return { handlePrefetch };
}
