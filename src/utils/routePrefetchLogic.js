/**
 * Route prefetch loaders mapping — lazy route chunk imports.
 */
export const PREFETCHABLE_ROUTES = {
  events: () => import('../Pages/EventPage/Eventpage.jsx'),
  contact: () => import('../Components/ContactUs/ContactUs.jsx'),
};

/**
 * Prefetches the code chunk for a specific route identifier.
 *
 * @param {string} routeId - e.g. 'events' or 'contact'
 * @returns {Promise<any>}
 */
export function prefetchRoute(routeId) {
  const loader = PREFETCHABLE_ROUTES[routeId];
  if (typeof loader === 'function') {
    return loader().catch(() => {});
  }
  return Promise.resolve();
}

/**
 * Prefetches all prefetchable lazy routes.
 *
 * @returns {Promise<any[]>}
 */
export function prefetchDefaultRoutes() {
  return Promise.all(Object.keys(PREFETCHABLE_ROUTES).map(prefetchRoute));
}
