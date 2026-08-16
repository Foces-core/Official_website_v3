import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  registerPrefetchRoute,
  unregisterPrefetchRoute,
  getRegisteredRouteIds,
  clearPrefetchRoutes,
  shouldPrefetchConnection,
  prefetchRoute,
  prefetchDefaultRoutes,
  scheduleIdlePrefetch,
  initForesightPrefetch,
} from '../../src/utils/routePrefetchLogic.js';

describe('routePrefetchLogic pure manager', () => {
  beforeEach(() => {
    clearPrefetchRoutes();
    registerPrefetchRoute('events', () => Promise.resolve({ default: 'EventsModule' }));
    registerPrefetchRoute('contact', () => Promise.resolve({ default: 'ContactModule' }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('shouldPrefetchConnection gating', () => {
    it('returns false when slowNetwork flag is true', () => {
      expect(shouldPrefetchConnection({ slowNetwork: true })).toBe(false);
    });

    it('returns false when navigator.connection.saveData is true', () => {
      expect(
        shouldPrefetchConnection({
          connection: { saveData: true, effectiveType: '4g' },
        }),
      ).toBe(false);
    });

    it('returns false for 2g or slow-2g connections', () => {
      expect(
        shouldPrefetchConnection({
          connection: { saveData: false, effectiveType: '2g' },
        }),
      ).toBe(false);
      expect(
        shouldPrefetchConnection({
          connection: { saveData: false, effectiveType: 'slow-2g' },
        }),
      ).toBe(false);
    });

    it('returns true for 3g, 4g, or fast unmetered connections', () => {
      expect(
        shouldPrefetchConnection({
          connection: { saveData: false, effectiveType: '4g' },
        }),
      ).toBe(true);
      expect(
        shouldPrefetchConnection({
          connection: { saveData: false, effectiveType: '3g' },
        }),
      ).toBe(true);
      expect(shouldPrefetchConnection({})).toBe(true);
    });
  });

  describe('registry and execution', () => {
    it('registers and unregisters route loaders', () => {
      const customLoader = vi.fn(() => Promise.resolve({}));
      registerPrefetchRoute('custom', customLoader);
      expect(getRegisteredRouteIds()).toContain('custom');

      unregisterPrefetchRoute('custom');
      expect(getRegisteredRouteIds()).not.toContain('custom');
    });

    it('executes registered loader when connection is fast', async () => {
      const loader = vi.fn(() => Promise.resolve({ default: 'Loaded' }));
      registerPrefetchRoute('test-route', loader);

      await prefetchRoute('test-route', { slowNetwork: false });
      expect(loader).toHaveBeenCalledTimes(1);
    });

    it('bypasses execution when connection is slow', async () => {
      const loader = vi.fn(() => Promise.resolve({ default: 'Loaded' }));
      registerPrefetchRoute('test-route', loader);

      await prefetchRoute('test-route', { slowNetwork: true });
      expect(loader).not.toHaveBeenCalled();
    });

    it('prefetchDefaultRoutes prefetches all registered routes', async () => {
      const results = await prefetchDefaultRoutes({ slowNetwork: false });
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(2);
    });
  });

  describe('scheduleIdlePrefetch', () => {
    it('schedules idle prefetch and allows cancellation', () => {
      vi.useFakeTimers();
      const setTimeoutSpy = vi.fn(setTimeout);
      const clearTimeoutSpy = vi.fn(clearTimeout);

      const cancel = scheduleIdlePrefetch({
        delayMs: 500,
        slowNetwork: false,
        setTimeoutFn: setTimeoutSpy,
        clearTimeoutFn: clearTimeoutSpy,
      });

      expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
      cancel();
      expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
      vi.useRealTimers();
    });

    it('returns no-op cancel handle on slow network', () => {
      const cancel = scheduleIdlePrefetch({ slowNetwork: true });
      expect(typeof cancel).toBe('function');
      cancel();
    });
  });

  describe('initForesightPrefetch', () => {
    it('returns a cleanup handle and gracefully handles missing elements or slow network', () => {
      const cleanup1 = initForesightPrefetch({ slowNetwork: true });
      expect(typeof cleanup1).toBe('function');
      cleanup1();

      const cleanup2 = initForesightPrefetch({ slowNetwork: false, doc: document });
      expect(typeof cleanup2).toBe('function');
      cleanup2();
    });
  });
});
