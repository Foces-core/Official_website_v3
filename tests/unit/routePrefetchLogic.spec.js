import { describe, it, expect } from 'vitest';
import {
  PREFETCHABLE_ROUTES,
  prefetchRoute,
  prefetchDefaultRoutes,
} from '../../src/utils/routePrefetchLogic.js';

describe('routePrefetchLogic pure helpers', () => {
  it('defines loaders for events and contact routes', () => {
    expect(typeof PREFETCHABLE_ROUTES.events).toBe('function');
    expect(typeof PREFETCHABLE_ROUTES.contact).toBe('function');
  });

  it('safely prefetches known routes without throwing', async () => {
    const res1 = await prefetchRoute('events');
    const res2 = await prefetchRoute('contact');
    expect(res1).toBeDefined();
    expect(res2).toBeDefined();
  });

  it('returns resolved promise for unknown route IDs', async () => {
    const res = await prefetchRoute('unknown-route-id');
    expect(res).toBeUndefined();
  });

  it('prefetchDefaultRoutes prefetches all registered routes', async () => {
    const results = await prefetchDefaultRoutes();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(Object.keys(PREFETCHABLE_ROUTES).length);
  });
});
