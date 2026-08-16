/**
 * Pure Route Prefetch Manager
 *
 * Implements:
 * - Dynamic loader registration (registerPrefetchRoute, unregisterPrefetchRoute)
 * - Network capability & Data-Saver gating (shouldPrefetchConnection)
 * - Pure idle scheduler with cancellation handle (scheduleIdlePrefetch)
 * - Pure ForesightJS ML predictor initializer (initForesightPrefetch)
 */

const registry = new Map();

// Register default application route chunk loaders
registry.set('events', () => import('../Pages/EventPage/Eventpage.jsx'));
registry.set('contact', () => import('../Components/ContactUs/ContactUs.jsx'));

/**
 * Registers a route loader function for a given route identifier.
 *
 * @param {string} routeId
 * @param {() => Promise<any>} loaderFn
 */
export function registerPrefetchRoute(routeId, loaderFn) {
  if (routeId && typeof loaderFn === 'function') {
    registry.set(routeId, loaderFn);
  }
}

/**
 * Unregisters a route loader function.
 *
 * @param {string} routeId
 */
export function unregisterPrefetchRoute(routeId) {
  registry.delete(routeId);
}

/**
 * Returns all currently registered route IDs.
 *
 * @returns {string[]}
 */
export function getRegisteredRouteIds() {
  return Array.from(registry.keys());
}

/**
 * Clears all registered route loaders (mainly for test isolation).
 */
export function clearPrefetchRoutes() {
  registry.clear();
}

/**
 * Pure network connection gate: determines if prefetching is allowed based
 * on device profile, Data-Saver headers, and effective network round-trip speed.
 *
 * @param {{
 *   slowNetwork?: boolean,
 *   connection?: { saveData?: boolean, effectiveType?: string },
 *   nav?: Navigator | { connection?: { saveData?: boolean, effectiveType?: string } }
 * }} options
 * @returns {boolean}
 */
export function shouldPrefetchConnection({
  slowNetwork = false,
  connection,
  nav = typeof navigator !== 'undefined' ? navigator : null,
} = {}) {
  if (slowNetwork) return false;

  const conn = connection || (nav && nav.connection);
  if (conn) {
    if (conn.saveData === true) return false;
    if (conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g') return false;
  }

  return true;
}

/**
 * Prefetches the code chunk for a specific route identifier, gated by connection policy.
 *
 * @param {string} routeId
 * @param {{
 *   slowNetwork?: boolean,
 *   connection?: any,
 *   nav?: any
 * }} options
 * @returns {Promise<any>}
 */
export function prefetchRoute(routeId, options = {}) {
  if (!shouldPrefetchConnection(options)) {
    return Promise.resolve();
  }

  const loader = registry.get(routeId);
  if (typeof loader === 'function') {
    return loader().catch(() => {});
  }
  return Promise.resolve();
}

/**
 * Prefetches all registered lazy routes, gated by connection policy.
 *
 * @param {{
 *   slowNetwork?: boolean,
 *   connection?: any,
 *   nav?: any
 * }} options
 * @returns {Promise<any[]>}
 */
export function prefetchDefaultRoutes(options = {}) {
  if (!shouldPrefetchConnection(options)) {
    return Promise.resolve([]);
  }
  const routeIds = getRegisteredRouteIds();
  return Promise.all(routeIds.map((id) => prefetchRoute(id, options)));
}

/**
 * Schedules idle preloading of default routes after a timer delay,
 * returning a pure cancel handle.
 *
 * @param {{
 *   delayMs?: number,
 *   slowNetwork?: boolean,
 *   connection?: any,
 *   nav?: any,
 *   setTimeoutFn?: typeof setTimeout,
 *   clearTimeoutFn?: typeof clearTimeout
 * }} options
 * @returns {() => void} cancelHandle
 */
export function scheduleIdlePrefetch({
  delayMs = 1200,
  slowNetwork = false,
  connection,
  nav = typeof navigator !== 'undefined' ? navigator : null,
  setTimeoutFn = typeof setTimeout !== 'undefined' ? setTimeout : null,
  clearTimeoutFn = typeof clearTimeout !== 'undefined' ? clearTimeout : null,
} = {}) {
  if (!shouldPrefetchConnection({ slowNetwork, connection, nav }) || !setTimeoutFn) {
    return () => {};
  }

  const timer = setTimeoutFn(() => {
    prefetchDefaultRoutes({ slowNetwork, connection, nav });
  }, delayMs);

  return () => {
    if (clearTimeoutFn) {
      clearTimeoutFn(timer);
    }
  };
}

/**
 * Initializes ForesightJS trajectory prediction for registered route links.
 * Returns a pure cleanup handle.
 *
 * @param {{
 *   routeIds?: string[],
 *   slowNetwork?: boolean,
 *   connection?: any,
 *   nav?: any,
 *   doc?: Document,
 *   onPrefetch?: (id: string) => void,
 *   ForesightLoader?: () => Promise<{ ForesightManager: any }>
 * }} options
 * @returns {() => void} cleanupHandle
 */
export function initForesightPrefetch({
  routeIds = ['events', 'contact'],
  slowNetwork = false,
  connection,
  nav = typeof navigator !== 'undefined' ? navigator : null,
  doc = typeof document !== 'undefined' ? document : null,
  onPrefetch = (id) => prefetchRoute(id, { slowNetwork, connection, nav }),
  ForesightLoader = () => import('js.foresight'),
} = {}) {
  if (!shouldPrefetchConnection({ slowNetwork, connection, nav }) || !doc) {
    return () => {};
  }

  let cancelled = false;
  const unregisters = [];

  ForesightLoader()
    .then(({ ForesightManager }) => {
      if (cancelled || !ForesightManager) return;
      if (!ForesightManager.isInitiated) {
        ForesightManager.initialize({
          enableManagerLogging: false,
          minimumConnectionType: '3g',
          setDataAttributes: false,
        });
      }
      const manager = ForesightManager.instance;
      if (!manager) return;

      const elements = doc.querySelectorAll('[data-foresight]');
      elements.forEach((el) => {
        const id = el.getAttribute('data-foresight');
        if (id && routeIds.includes(id)) {
          manager.register({
            element: el,
            name: id,
            callback: () => onPrefetch(id),
          });
          unregisters.push(() => {
            try {
              manager.unregister(el);
            } catch {
              // Ignore unregister errors on unmount
            }
          });
        }
      });
    })
    .catch(() => {});

  return () => {
    cancelled = true;
    unregisters.forEach((fn) => fn());
  };
}
