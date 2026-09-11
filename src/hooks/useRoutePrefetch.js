import { useEffect, useCallback, useState } from 'react';
import {
  prefetchRoute,
  scheduleIdlePrefetch,
  initForesightPrefetch,
} from '../utils/routePrefetchLogic.js';

/**
 * True when the document already finished loading (late-mounted trees skip
 * the 'load' wait). Isolated for the load-timing rule below.
 */
function readLoadComplete() {
  return typeof document !== 'undefined' && document.readyState === 'complete';
}

/**
 * Thin React hook wiring route prefetching to the component lifecycle:
 * - Direct intent prefetch handler (hover / focus / touch)
 * - Idle background route preloading (delayed timer)
 * - ForesightJS machine-learning trajectory prediction
 *
 * Gating policy (slowNetwork, Data-Saver, effective connection type)
 * lives in the pure routePrefetchLogic manager (ADR-0009 / ADR-0010).
 *
 * Timing rule (owned here, not in the manager): background prefetch — the
 * idle timer AND the ForesightJS predictor download — starts only after
 * window 'load', so route chunks (~50KB) and the predictor library (~25KB)
 * never contend with LCP resources (entry JS, CSS, fonts, hero image) on
 * slow networks. Direct intent prefetch via handlePrefetch stays available
 * from mount: a hover/tap means the user is already going there.
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
  const [loadDone, setLoadDone] = useState(readLoadComplete);

  useEffect(() => {
    if (loadDone) return undefined;
    const onLoad = () => setLoadDone(true);
    window.addEventListener('load', onLoad, { once: true });
    return () => window.removeEventListener('load', onLoad);
  }, [loadDone]);

  const handlePrefetch = useCallback(
    (id) => {
      prefetchRoute(id, { slowNetwork });
    },
    [slowNetwork],
  );

  // 1. Idle route preloading (pure manager handles network check and timeout)
  useEffect(() => {
    if (!loadDone) return undefined;
    const cancel = scheduleIdlePrefetch({
      delayMs: idleDelayMs,
      slowNetwork,
    });
    return cancel;
  }, [slowNetwork, idleDelayMs, loadDone]);

  // 2. ForesightJS prediction integration (pure manager handles network check and registration)
  useEffect(() => {
    if (!loadDone) return undefined;
    const cleanup = initForesightPrefetch({
      routeIds: ['events', 'contact'],
      slowNetwork,
      onPrefetch: handlePrefetch,
    });
    return cleanup;
  }, [slowNetwork, handlePrefetch, loadDone]);

  return { handlePrefetch };
}
