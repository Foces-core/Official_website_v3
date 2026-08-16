import { useEffect, useCallback } from 'react';
import { prefetchRoute, prefetchDefaultRoutes } from '../utils/routePrefetchLogic.js';

/**
 * Encapsulates the entire route prefetching subsystem:
 * - Intent-driven prefetching (hover/touch/focus/pointerdown)
 * - Browser idle time preloading
 * - ForesightJS machine-learning trajectory prediction
 * - Centralized slow-network gating (never prefetch on slow/metered connections)
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
  // 1. Direct intent prefetch handler
  const handlePrefetch = useCallback(
    (id) => {
      if (slowNetwork) return;
      prefetchRoute(id);
    },
    [slowNetwork],
  );

  // 2. Idle preload (skipped on slow network)
  useEffect(() => {
    if (slowNetwork) return;
    const timer = setTimeout(() => {
      prefetchDefaultRoutes();
    }, idleDelayMs);
    return () => clearTimeout(timer);
  }, [slowNetwork, idleDelayMs]);

  // 3. ForesightJS prediction integration (skipped on slow network)
  useEffect(() => {
    if (slowNetwork) return;
    let cancelled = false;
    let unregisters = [];

    import('js.foresight')
      .then(({ ForesightManager }) => {
        if (cancelled) return;
        if (!ForesightManager.isInitiated) {
          ForesightManager.initialize({
            enableManagerLogging: false,
            minimumConnectionType: '3g',
            setDataAttributes: false,
          });
        }
        const manager = ForesightManager.instance;
        const elements = document.querySelectorAll('[data-foresight]');
        elements.forEach((el) => {
          const id = el.getAttribute('data-foresight');
          if (id === 'events' || id === 'contact') {
            manager.register({
              element: el,
              name: id,
              callback: () => handlePrefetch(id),
            });
            unregisters.push(() => manager.unregister(el));
          }
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      unregisters.forEach((fn) => fn());
    };
  }, [slowNetwork, handlePrefetch]);

  return { handlePrefetch };
}
