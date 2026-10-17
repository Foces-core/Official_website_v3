import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  registerPrefetchRoute,
  unregisterPrefetchRoute,
  getRegisteredRouteIds,
  clearPrefetchRoutes,
  shouldPrefetchConnection,
  isDataSaverEnabled,
  isSlowConnection,
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
    vi.unstubAllGlobals();
  });

  describe('shouldPrefetchConnection gating', () => {
    it('recognizes only explicit Data-Saver and slow-2g connection flags', () => {
      expect(isDataSaverEnabled({ saveData: true })).toBe(true);
      expect(isDataSaverEnabled({ saveData: 1 })).toBe(false);
      expect(isDataSaverEnabled(null)).toBe(false);
      expect(isSlowConnection({ effectiveType: '2g' })).toBe(true);
      expect(isSlowConnection({ effectiveType: 'slow-2g' })).toBe(true);
      expect(isSlowConnection({ effectiveType: '3g' })).toBe(false);
      expect(isSlowConnection(undefined)).toBe(false);
    });

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

    it('uses navigator.connection as a fallback and explicit connections as authoritative', () => {
      expect(shouldPrefetchConnection({ nav: { connection: { effectiveType: '2g' } } })).toBe(
        false,
      );
      expect(
        shouldPrefetchConnection({
          connection: { effectiveType: '4g' },
          nav: { connection: { effectiveType: 'slow-2g', saveData: true } },
        }),
      ).toBe(true);
    });

    it('uses the browser navigator by default when applying network gates', () => {
      vi.stubGlobal('navigator', { connection: { effectiveType: 'slow-2g' } });
      expect(shouldPrefetchConnection()).toBe(false);

      const setTimeoutFn = vi.fn();
      scheduleIdlePrefetch({ setTimeoutFn });
      expect(setTimeoutFn).not.toHaveBeenCalled();
    });
  });

  describe('registry and execution', () => {
    it('registers the built-in route loaders under their public route IDs', async () => {
      vi.resetModules();
      const freshManager = await import('../../src/utils/routePrefetchLogic.js');

      expect(freshManager.getRegisteredRouteIds()).toEqual(['events', 'contact']);
      await expect(freshManager.prefetchRoute('events')).resolves.toHaveProperty('default');
      await expect(freshManager.prefetchRoute('contact')).resolves.toHaveProperty('default');
    });

    it('registers and unregisters route loaders', () => {
      const customLoader = vi.fn(() => Promise.resolve({}));
      registerPrefetchRoute('custom', customLoader);
      expect(getRegisteredRouteIds()).toContain('custom');

      unregisterPrefetchRoute('custom');
      expect(getRegisteredRouteIds()).not.toContain('custom');
    });

    it('ignores invalid registrations, overwrites valid loaders, and resolves unknown routes', async () => {
      const original = vi.fn(() => Promise.resolve('old'));
      const replacement = vi.fn(() => Promise.resolve('new'));
      registerPrefetchRoute('', replacement);
      registerPrefetchRoute('invalid-loader', null);
      registerPrefetchRoute('custom', original);
      registerPrefetchRoute('custom', replacement);

      await prefetchRoute('custom');
      await expect(prefetchRoute('missing')).resolves.toBeUndefined();

      expect(original).not.toHaveBeenCalled();
      expect(replacement).toHaveBeenCalledOnce();
      expect(getRegisteredRouteIds()).not.toContain('invalid-loader');
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

    it('returns an empty list when the connection policy blocks all default routes', async () => {
      await expect(prefetchDefaultRoutes({ connection: { effectiveType: '2g' } })).resolves.toEqual(
        [],
      );
    });

    it('swallows rejected route-loader promises', async () => {
      registerPrefetchRoute('rejecting', () => Promise.reject(new Error('chunk unavailable')));
      await expect(prefetchRoute('rejecting')).resolves.toBeUndefined();
    });

    it('swallows route loaders that throw before returning a promise', async () => {
      registerPrefetchRoute('throwing', () => {
        throw new Error('loader failed synchronously');
      });
      await expect(prefetchRoute('throwing')).resolves.toBeUndefined();
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

    it('uses the default delay, executes the callback, and tolerates a missing clear timer', async () => {
      vi.useFakeTimers();
      const callbacks = [];
      const setTimeoutFn = vi.fn((callback, delay) => {
        callbacks.push(callback);
        return delay;
      });
      const eventsLoader = vi.fn(() => Promise.resolve({ default: 'Events' }));
      registerPrefetchRoute('events', eventsLoader);

      const cancel = scheduleIdlePrefetch({ setTimeoutFn, clearTimeoutFn: null });
      expect(setTimeoutFn).toHaveBeenCalledWith(expect.any(Function), 1200);
      cancel();
      callbacks[0]();
      await vi.waitFor(() => expect(eventsLoader).toHaveBeenCalledOnce());
      vi.useRealTimers();
    });

    it('returns a no-op when no timer function is available', () => {
      const cancel = scheduleIdlePrefetch({ setTimeoutFn: null });
      expect(cancel).not.toThrow();
    });

    it('uses the browser timer defaults only when those APIs exist', () => {
      vi.stubGlobal('setTimeout', undefined);
      expect(scheduleIdlePrefetch()).not.toThrow();
      vi.unstubAllGlobals();

      vi.stubGlobal('clearTimeout', undefined);
      const setTimeoutFn = vi.fn(() => 17);
      const cancel = scheduleIdlePrefetch({ setTimeoutFn });
      expect(setTimeoutFn).toHaveBeenCalledOnce();
      expect(cancel).not.toThrow();
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

    it('skips initialization when there is no document', () => {
      const ForesightLoader = vi.fn();
      const cleanup = initForesightPrefetch({ doc: null, ForesightLoader });
      expect(typeof cleanup).toBe('function');
      cleanup();
      expect(ForesightLoader).not.toHaveBeenCalled();
    });

    it('initializes Foresight and registers only known route links', async () => {
      const eventsLink = { getAttribute: vi.fn(() => 'events') };
      const unknownLink = { getAttribute: vi.fn(() => 'unknown') };
      const manager = { register: vi.fn(), unregister: vi.fn() };
      const ForesightManager = {
        isInitiated: false,
        initialize: vi.fn(),
        instance: manager,
      };
      const onPrefetch = vi.fn();
      const cleanup = initForesightPrefetch({
        routeIds: ['events'],
        doc: { querySelectorAll: () => [eventsLink, unknownLink] },
        ForesightLoader: vi.fn().mockResolvedValue({ ForesightManager }),
        onPrefetch,
      });

      await vi.waitFor(() => expect(manager.register).toHaveBeenCalledOnce());
      expect(ForesightManager.initialize).toHaveBeenCalledWith({
        enableManagerLogging: false,
        minimumConnectionType: '3g',
        setDataAttributes: false,
      });
      const registration = manager.register.mock.calls[0][0];
      expect(registration).toMatchObject({ element: eventsLink, name: 'events' });
      registration.callback();
      expect(onPrefetch).toHaveBeenCalledWith('events');

      cleanup();
      expect(manager.unregister).toHaveBeenCalledWith(eventsLink);
    });

    it('does not reinitialize an existing manager and ignores unregister errors', async () => {
      const link = { getAttribute: () => 'contact' };
      const manager = {
        register: vi.fn(),
        unregister: vi.fn(() => {
          throw new Error('gone');
        }),
      };
      const ForesightManager = {
        isInitiated: true,
        initialize: vi.fn(),
        instance: manager,
      };
      const cleanup = initForesightPrefetch({
        routeIds: ['contact'],
        doc: { querySelectorAll: () => [link] },
        ForesightLoader: async () => ({ ForesightManager }),
      });

      await vi.waitFor(() => expect(manager.register).toHaveBeenCalledOnce());
      expect(ForesightManager.initialize).not.toHaveBeenCalled();
      expect(() => cleanup()).not.toThrow();
    });

    it('defaults Foresight registration to the built-in events and contact routes', async () => {
      const manager = { register: vi.fn(), unregister: vi.fn() };
      const ForesightManager = { isInitiated: true, initialize: vi.fn(), instance: manager };
      const doc = {
        querySelectorAll: () => [
          { getAttribute: () => 'events' },
          { getAttribute: () => 'contact' },
          { getAttribute: () => '' },
        ],
      };
      const cleanup = initForesightPrefetch({
        doc,
        ForesightLoader: async () => ({ ForesightManager }),
      });

      await vi.waitFor(() => expect(manager.register).toHaveBeenCalledTimes(2));
      expect(manager.register.mock.calls.map(([item]) => item.name)).toEqual(['events', 'contact']);
      cleanup();
    });

    it('uses document and onPrefetch defaults when those options are omitted', async () => {
      const link = { getAttribute: () => 'events' };
      const querySelectorAll = vi.spyOn(document, 'querySelectorAll').mockReturnValue([link]);
      const eventsLoader = vi.fn(() => Promise.resolve({ default: 'Events' }));
      registerPrefetchRoute('events', eventsLoader);
      const manager = { register: vi.fn(), unregister: vi.fn() };
      const ForesightManager = { isInitiated: true, instance: manager };
      const cleanup = initForesightPrefetch({
        ForesightLoader: async () => ({ ForesightManager }),
      });

      await vi.waitFor(() => expect(manager.register).toHaveBeenCalledOnce());
      manager.register.mock.calls[0][0].callback();
      await vi.waitFor(() => expect(eventsLoader).toHaveBeenCalledOnce());
      expect(querySelectorAll).toHaveBeenCalledWith('[data-foresight]');
      cleanup();
    });

    it('ignores load results after cleanup and swallows loader failures', async () => {
      let resolveLoader;
      const ForesightLoader = () =>
        new Promise((resolve) => {
          resolveLoader = resolve;
        });
      const manager = { register: vi.fn(), unregister: vi.fn() };
      const ForesightManager = { isInitiated: false, initialize: vi.fn(), instance: manager };
      const cleanup = initForesightPrefetch({
        doc: { querySelectorAll: () => [{ getAttribute: () => 'events' }] },
        ForesightLoader,
      });
      await vi.waitFor(() => expect(resolveLoader).toBeTypeOf('function'));
      cleanup();
      resolveLoader({ ForesightManager });
      await Promise.resolve();
      await Promise.resolve();
      expect(ForesightManager.initialize).not.toHaveBeenCalled();
      expect(manager.register).not.toHaveBeenCalled();

      initForesightPrefetch({
        doc: document,
        ForesightLoader: () => Promise.reject(new Error('loader unavailable')),
      });
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    it('swallows a loader that throws before returning a promise', () => {
      expect(() =>
        initForesightPrefetch({
          doc: document,
          ForesightLoader: () => {
            throw new Error('Foresight loader failed synchronously');
          },
        }),
      ).not.toThrow();
    });
  });
});
