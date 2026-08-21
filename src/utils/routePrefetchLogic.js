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

registry.set('events', () => import('../Pages/EventPage/Eventpage.jsx'));
registry.set('contact', () => import('../Components/ContactUs/ContactUs.jsx'));

const NOOP = () => {};

export function isDataSaverEnabled(conn) {
  return conn?.saveData === true;
}

export function isSlowConnection(conn) {
  return conn?.effectiveType === '2g' || conn?.effectiveType === 'slow-2g';
}

function resolveConnection(connection, nav) {
  return connection || (nav && nav.connection) || null;
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
  const conn = resolveConnection(connection, nav);
  if (isDataSaverEnabled(conn)) return false;
  if (isSlowConnection(conn)) return false;
  return true;
}

function getRouteLoader(routeId) {
  return registry.get(routeId);
}

function safeInvokeLoader(loader) {
  if (typeof loader !== 'function') return null;
  return loader().catch(() => {});
}

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
  if (!shouldPrefetchConnection(options)) return Promise.resolve();
  const result = safeInvokeLoader(getRouteLoader(routeId));
  return result ?? Promise.resolve();
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
  if (!shouldPrefetchConnection(options)) return Promise.resolve([]);
  const routeIds = getRegisteredRouteIds();
  return Promise.all(routeIds.map((id) => prefetchRoute(id, options)));
}

function shouldScheduleIdle({ slowNetwork, connection, nav }, setTimeoutFn) {
  if (!setTimeoutFn) return false;
  return shouldPrefetchConnection({ slowNetwork, connection, nav });
}

function createCancelHandle(timer, clearTimeoutFn) {
  return () => {
    if (clearTimeoutFn) clearTimeoutFn(timer);
  };
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
  if (!shouldScheduleIdle({ slowNetwork, connection, nav }, setTimeoutFn)) {
    return NOOP;
  }
  const timer = setTimeoutFn(() => {
    prefetchDefaultRoutes({ slowNetwork, connection, nav });
  }, delayMs);
  return createCancelHandle(timer, clearTimeoutFn);
}

function shouldInitForesight({ slowNetwork, connection, nav }, doc) {
  if (!doc) return false;
  return shouldPrefetchConnection({ slowNetwork, connection, nav });
}

function ensureForesightInitialized(ForesightManager) {
  if (ForesightManager.isInitiated) return;
  ForesightManager.initialize({
    enableManagerLogging: false,
    minimumConnectionType: '3g',
    setDataAttributes: false,
  });
}

function isAllowedRouteId(id, routeIds) {
  return Boolean(id && routeIds.includes(id));
}

function registerForesightElement(manager, element, routeIds, onPrefetch, unregisters) {
  const id = element.getAttribute('data-foresight');
  if (!isAllowedRouteId(id, routeIds)) return;
  manager.register({
    element,
    name: id,
    callback: () => onPrefetch(id),
  });
  unregisters.push(() => {
    try {
      manager.unregister(element);
    } catch {
      // Ignore unregister errors on unmount
    }
  });
}

function setupForesightElements(doc, manager, routeIds, onPrefetch, unregisters) {
  const elements = doc.querySelectorAll('[data-foresight]');
  elements.forEach((el) =>
    registerForesightElement(manager, el, routeIds, onPrefetch, unregisters),
  );
}

function handleForesightReady(
  ForesightManager,
  doc,
  routeIds,
  onPrefetch,
  unregisters,
  cancelledRef,
) {
  if (cancelledRef.cancelled || !ForesightManager) return;
  ensureForesightInitialized(ForesightManager);
  const manager = ForesightManager.instance;
  if (!manager) return;
  setupForesightElements(doc, manager, routeIds, onPrefetch, unregisters);
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
  if (!shouldInitForesight({ slowNetwork, connection, nav }, doc)) {
    return NOOP;
  }
  const cancelledRef = { cancelled: false };
  const unregisters = [];
  ForesightLoader()
    .then(({ ForesightManager }) =>
      handleForesightReady(ForesightManager, doc, routeIds, onPrefetch, unregisters, cancelledRef),
    )
    .catch(() => {});
  return () => {
    cancelledRef.cancelled = true;
    unregisters.forEach((fn) => fn());
  };
}
