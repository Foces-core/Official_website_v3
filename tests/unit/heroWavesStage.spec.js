import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initHeroWavesStage } from '../../src/Components/HeroStage/heroWavesStage.js';
import {
  shouldInitHeroWaves,
  VANTA_WAVES_CONFIG,
} from '../../src/Components/HeroStage/heroWavesPolicy.js';

const mockDefaultWaves = vi.hoisted(() => vi.fn(() => ({ destroy: vi.fn() })));
vi.mock('three', () => ({ mockedThree: true }));
vi.mock('vanta/dist/vanta.waves.min', () => ({ default: mockDefaultWaves }));

describe('heroWavesStage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('shouldInitHeroWaves', () => {
    it('returns false when the webgl capability is off regardless of width', () => {
      expect(shouldInitHeroWaves({ webgl: false, width: 1440 })).toBe(false);
      expect(shouldInitHeroWaves({ webgl: false, width: 375 })).toBe(false);
    });

    it('returns false for mobile / tablet widths (< 1024)', () => {
      expect(shouldInitHeroWaves({ webgl: true, width: 375 })).toBe(false);
      expect(shouldInitHeroWaves({ webgl: true, width: 768 })).toBe(false);
      expect(shouldInitHeroWaves({ webgl: true, width: 1023 })).toBe(false);
    });

    it('returns true for desktop-wide widths (>= 1024) on normal devices', () => {
      expect(shouldInitHeroWaves({ webgl: true, width: 1024 })).toBe(true);
      expect(shouldInitHeroWaves({ webgl: true, width: 1920 })).toBe(true);
    });

    it('defaults webgl on (capability profile shape)', () => {
      expect(shouldInitHeroWaves({ width: 1200 })).toBe(true);
    });

    it('defaults width to the current browser viewport', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
      expect(shouldInitHeroWaves({})).toBe(true);
    });

    it('disables the stage when evaluated without a browser viewport', () => {
      const savedWindow = globalThis.window;
      delete globalThis.window;
      try {
        expect(shouldInitHeroWaves({})).toBe(false);
      } finally {
        globalThis.window = savedWindow;
      }
    });
  });

  it('keeps the intended waves visual configuration', () => {
    expect(VANTA_WAVES_CONFIG).toEqual({
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      scale: 1,
      scaleMobile: 1,
      color: 0x1a1a20,
      backgroundColor: 0x0a0a0c,
      shininess: 35,
      waveHeight: 18,
      waveSpeed: 0.75,
      zoom: 0.85,
    });
  });

  describe('initHeroWavesStage', () => {
    it('returns a no-op cleanup when container or conditions are invalid', () => {
      const destroy1 = initHeroWavesStage(null);
      expect(typeof destroy1).toBe('function');
      destroy1();

      const el = { addEventListener: vi.fn(), removeEventListener: vi.fn() };
      const destroy2 = initHeroWavesStage(el, { webgl: false, width: 1440 });
      expect(typeof destroy2).toBe('function');
      expect(el.addEventListener).not.toHaveBeenCalled();
      destroy2();
    });

    it('attaches webglcontextlost listener and schedules background loading', async () => {
      const listeners = {};
      const el = {
        addEventListener: vi.fn((ev, fn) => {
          listeners[ev] = fn;
        }),
        removeEventListener: vi.fn((ev) => {
          delete listeners[ev];
        }),
      };

      const mockVantaInstance = { destroy: vi.fn() };
      const mockWavesConstructor = vi.fn(() => mockVantaInstance);
      const mockLoader = vi.fn(async () => [{ isThree: true }, { default: mockWavesConstructor }]);
      const onInit = vi.fn();

      let scheduledTask = null;
      const scheduler = vi.fn((fn) => {
        scheduledTask = fn;
      });

      const destroy = initHeroWavesStage(el, {
        webgl: true,
        width: 1200,
        scheduler,
        loader: mockLoader,
        onInit,
      });

      expect(el.addEventListener).toHaveBeenCalledWith(
        'webglcontextlost',
        expect.any(Function),
        true,
      );
      expect(scheduler).toHaveBeenCalledTimes(1);

      // Execute background task
      await scheduledTask();

      expect(mockLoader).toHaveBeenCalledTimes(1);
      expect(mockWavesConstructor).toHaveBeenCalledWith(
        expect.objectContaining({
          el,
          THREE: { isThree: true },
          ...VANTA_WAVES_CONFIG,
        }),
      );
      expect(onInit).toHaveBeenCalledWith(mockVantaInstance);

      // Teardown
      destroy();
      expect(el.removeEventListener).toHaveBeenCalledWith(
        'webglcontextlost',
        expect.any(Function),
        true,
      );
      expect(el.removeEventListener).toHaveBeenCalledWith(
        'webglcontextrestored',
        expect.any(Function),
        true,
      );
      expect(mockVantaInstance.destroy).toHaveBeenCalledTimes(1);
    });

    it('loads the default Three and Vanta dependencies when no loader is injected', async () => {
      const el = { addEventListener: vi.fn(), removeEventListener: vi.fn() };
      const tasks = [];
      const onInit = vi.fn();
      const destroy = initHeroWavesStage(el, {
        width: 1200,
        scheduler: (task) => tasks.push(task),
        onInit,
      });

      await tasks[0]();

      expect(mockDefaultWaves).toHaveBeenCalledWith(
        expect.objectContaining({ el, THREE: expect.objectContaining({ mockedThree: true }) }),
      );
      expect(onInit).toHaveBeenCalledWith(mockDefaultWaves.mock.results[0].value);
      destroy();
    });

    it('accepts a Vanta constructor exported directly by the loader', async () => {
      const el = { addEventListener: vi.fn(), removeEventListener: vi.fn() };
      const tasks = [];
      const instance = { destroy: vi.fn() };
      const waves = vi.fn(() => instance);
      const onInit = vi.fn();
      const destroy = initHeroWavesStage(el, {
        width: 1200,
        scheduler: (task) => tasks.push(task),
        loader: vi.fn(async () => [{}, waves]),
        onInit,
      });

      await tasks[0]();

      expect(waves).toHaveBeenCalledTimes(1);
      expect(onInit).toHaveBeenCalledWith(instance);
      destroy();
    });

    it('handles webglcontextlost event gracefully and destroys instance', async () => {
      let contextLostHandler = null;
      const el = {
        addEventListener: vi.fn((ev, fn) => {
          if (ev === 'webglcontextlost') contextLostHandler = fn;
        }),
        removeEventListener: vi.fn(),
      };

      const mockVantaInstance = { destroy: vi.fn() };
      const mockWavesConstructor = vi.fn(() => mockVantaInstance);
      const mockLoader = vi.fn(async () => [{}, { default: mockWavesConstructor }]);

      let scheduledTask = null;
      const scheduler = (fn) => {
        scheduledTask = fn;
      };

      initHeroWavesStage(el, {
        webgl: true,
        width: 1200,
        scheduler,
        loader: mockLoader,
      });

      await scheduledTask();

      const mockEvent = { preventDefault: vi.fn() };
      contextLostHandler(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalledTimes(1);
      expect(mockVantaInstance.destroy).toHaveBeenCalledTimes(1);
    });

    it('ignores repeated context-loss notifications until the context is restored', async () => {
      let contextLost;
      const el = {
        addEventListener: vi.fn((event, fn) => {
          if (event === 'webglcontextlost') contextLost = fn;
        }),
        removeEventListener: vi.fn(),
      };
      const effect = { destroy: vi.fn() };
      const tasks = [];
      const destroy = initHeroWavesStage(el, {
        width: 1200,
        scheduler: (task) => tasks.push(task),
        loader: vi.fn(async () => [{}, { default: () => effect }]),
      });

      await tasks[0]();
      const event = { preventDefault: vi.fn() };
      contextLost(event);
      contextLost(event);

      expect(event.preventDefault).toHaveBeenCalledTimes(2);
      expect(effect.destroy).toHaveBeenCalledTimes(1);
      destroy();
    });

    it('attaches restore recovery to the lost canvas and removes that listener after restore', () => {
      const listeners = {};
      const canvasListeners = {};
      const canvas = {
        addEventListener: vi.fn((event, fn) => {
          canvasListeners[event] = fn;
        }),
        removeEventListener: vi.fn((event) => {
          delete canvasListeners[event];
        }),
      };
      const el = {
        addEventListener: vi.fn((event, fn) => {
          listeners[event] = fn;
        }),
        removeEventListener: vi.fn(),
      };
      const tasks = [];
      const destroy = initHeroWavesStage(el, {
        width: 1200,
        scheduler: (task) => tasks.push(task),
        loader: vi.fn(),
      });
      const event = { target: canvas, preventDefault: vi.fn() };

      listeners.webglcontextlost(event);
      expect(canvas.addEventListener).toHaveBeenCalledWith(
        'webglcontextrestored',
        expect.any(Function),
        true,
      );
      canvasListeners.webglcontextrestored();
      expect(canvas.removeEventListener).toHaveBeenCalledWith(
        'webglcontextrestored',
        expect.any(Function),
        true,
      );
      expect(tasks).toHaveLength(2);
      destroy();
    });

    it('tolerates a context-loss event without preventDefault or canvas listener methods', () => {
      let contextLost;
      const el = {
        addEventListener: vi.fn((event, fn) => {
          if (event === 'webglcontextlost') contextLost = fn;
        }),
        removeEventListener: vi.fn(),
      };
      const destroy = initHeroWavesStage(el, {
        width: 1200,
        scheduler: vi.fn(),
        loader: vi.fn(),
      });

      expect(() => contextLost({ target: {} })).not.toThrow();
      expect(destroy).not.toThrow();
    });

    it('destroys an instance created during a context-loss race without publishing it', async () => {
      const listeners = {};
      const el = {
        addEventListener: vi.fn((event, fn) => {
          listeners[event] = fn;
        }),
        removeEventListener: vi.fn(),
      };
      const instance = { destroy: vi.fn() };
      const waves = vi.fn(() => {
        listeners.webglcontextlost({ preventDefault: vi.fn() });
        return instance;
      });
      const tasks = [];
      const onInit = vi.fn();
      const destroy = initHeroWavesStage(el, {
        width: 1200,
        scheduler: (task) => tasks.push(task),
        loader: vi.fn(async () => [{}, waves]),
        onInit,
      });

      await tasks[0]();

      expect(instance.destroy).toHaveBeenCalledTimes(1);
      expect(onInit).not.toHaveBeenCalled();
      destroy();
    });

    it('handles a missing instance when initialization is cancelled during construction', async () => {
      const listeners = {};
      const el = {
        addEventListener: vi.fn((event, fn) => {
          listeners[event] = fn;
        }),
        removeEventListener: vi.fn(),
      };
      const waves = vi.fn(() => {
        listeners.webglcontextlost({ preventDefault: vi.fn() });
        return null;
      });
      const tasks = [];
      const onInit = vi.fn();
      const destroy = initHeroWavesStage(el, {
        width: 1200,
        scheduler: (task) => tasks.push(task),
        loader: vi.fn(async () => [{}, waves]),
        onInit,
      });

      await expect(tasks[0]()).resolves.toBeUndefined();
      expect(onInit).not.toHaveBeenCalled();
      destroy();
    });

    it('ignores a queued context-loss event after teardown', () => {
      let contextLost;
      const el = {
        addEventListener: vi.fn((event, fn) => {
          if (event === 'webglcontextlost') contextLost = fn;
        }),
        removeEventListener: vi.fn(),
      };
      const canvas = { addEventListener: vi.fn(), removeEventListener: vi.fn() };
      const tasks = [];
      const destroy = initHeroWavesStage(el, {
        width: 1200,
        scheduler: (task) => tasks.push(task),
        loader: vi.fn(),
      });

      destroy();
      contextLost({ target: canvas, preventDefault: vi.fn() });

      expect(canvas.addEventListener).not.toHaveBeenCalled();
      expect(tasks).toHaveLength(1);
    });

    it('recreates the waves stage after the browser restores its WebGL context', async () => {
      const listeners = {};
      const el = {
        addEventListener: vi.fn((event, fn) => {
          listeners[event] = fn;
        }),
        removeEventListener: vi.fn(),
      };
      const first = { destroy: vi.fn() };
      const second = { destroy: vi.fn() };
      const createWaves = vi.fn().mockReturnValueOnce(first).mockReturnValueOnce(second);
      const loader = vi.fn(async () => [{}, { default: createWaves }]);
      const tasks = [];
      const onInit = vi.fn();
      const destroy = initHeroWavesStage(el, {
        width: 1200,
        scheduler: (task) => tasks.push(task),
        loader,
        onInit,
      });

      await tasks[0]();
      listeners.webglcontextlost({ preventDefault: vi.fn() });
      listeners.webglcontextrestored();
      expect(tasks).toHaveLength(2);
      await tasks[1]();

      expect(loader).toHaveBeenCalledTimes(2);
      expect(createWaves).toHaveBeenCalledTimes(2);
      expect(first.destroy).toHaveBeenCalledTimes(1);
      expect(onInit).toHaveBeenCalledTimes(2);
      destroy();
      expect(second.destroy).toHaveBeenCalledTimes(1);
    });

    it('discards a stale load when context is lost and restored mid-import', async () => {
      const listeners = {};
      const el = {
        addEventListener: vi.fn((event, fn) => {
          listeners[event] = fn;
        }),
        removeEventListener: vi.fn(),
      };
      const pendingLoads = [];
      const loader = vi.fn(
        () =>
          new Promise((resolve) => {
            pendingLoads.push(resolve);
          }),
      );
      const tasks = [];
      const instance = { destroy: vi.fn() };
      const waves = vi.fn(() => instance);
      const destroy = initHeroWavesStage(el, {
        width: 1200,
        scheduler: (task) => tasks.push(task),
        loader,
      });

      const staleTask = tasks[0]();
      listeners.webglcontextlost({ preventDefault: vi.fn() });
      listeners.webglcontextrestored();
      expect(tasks).toHaveLength(2);

      pendingLoads[0]([{}, { default: waves }]);
      await staleTask;
      expect(waves).not.toHaveBeenCalled();

      const restoredTask = tasks[1]();
      pendingLoads[1]([{}, { default: waves }]);
      await restoredTask;
      expect(waves).toHaveBeenCalledTimes(1);
      destroy();
    });

    it('does not create an instance when an async load finishes after teardown', async () => {
      const el = { addEventListener: vi.fn(), removeEventListener: vi.fn() };
      let resolveLoad;
      const loader = vi.fn(
        () =>
          new Promise((resolve) => {
            resolveLoad = resolve;
          }),
      );
      let scheduledTask;
      const waves = vi.fn();
      const onInit = vi.fn();
      const destroy = initHeroWavesStage(el, {
        width: 1200,
        scheduler: (task) => {
          scheduledTask = task;
        },
        loader,
        onInit,
      });

      const pendingTask = scheduledTask();
      destroy();
      resolveLoad([{}, { default: waves }]);
      await pendingTask;

      expect(waves).not.toHaveBeenCalled();
      expect(onInit).not.toHaveBeenCalled();
    });

    it('ignores an invalid Vanta module without reporting a load error', async () => {
      const el = { addEventListener: vi.fn(), removeEventListener: vi.fn() };
      let scheduledTask;
      const onInit = vi.fn();
      const onError = vi.fn();
      const destroy = initHeroWavesStage(el, {
        width: 1200,
        scheduler: (task) => {
          scheduledTask = task;
        },
        loader: vi.fn(async () => [{}, { default: {} }]),
        onInit,
        onError,
      });

      await scheduledTask();

      expect(onInit).not.toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
      destroy();
    });

    it('does not report an error from a load superseded by context recovery', async () => {
      const listeners = {};
      const el = {
        addEventListener: vi.fn((event, fn) => {
          listeners[event] = fn;
        }),
        removeEventListener: vi.fn(),
      };
      let rejectLoad;
      const tasks = [];
      const onError = vi.fn();
      const destroy = initHeroWavesStage(el, {
        width: 1200,
        scheduler: (task) => tasks.push(task),
        loader: vi.fn(
          () =>
            new Promise((_, reject) => {
              rejectLoad = reject;
            }),
        ),
        onError,
      });

      const staleTask = tasks[0]();
      listeners.webglcontextlost({ preventDefault: vi.fn() });
      listeners.webglcontextrestored();
      rejectLoad(new Error('stale load failed'));
      await staleTask;

      expect(onError).not.toHaveBeenCalled();
      destroy();
    });

    describe('off-screen pause (CPU)', () => {
      let ioCallback;

      // beforeInit runs AFTER the observer is installed (so ioCallback is the
      // CURRENT observer's callback) but BEFORE the scheduled loader task —
      // the window where the visibility race lives.
      const setup = async (beforeInit) => {
        const el = { addEventListener: vi.fn(), removeEventListener: vi.fn() };
        const vantaEffect = { req: 7, animationLoop: vi.fn(), destroy: vi.fn() };
        const mockWavesConstructor = vi.fn(() => vantaEffect);
        const mockLoader = vi.fn(async () => [{}, { default: mockWavesConstructor }]);
        let scheduledTask = null;
        const destroy = initHeroWavesStage(el, {
          webgl: true,
          width: 1200,
          scheduler: (fn) => {
            scheduledTask = fn;
          },
          loader: mockLoader,
        });
        beforeInit?.();
        await scheduledTask();
        return { el, vantaEffect, mockWavesConstructor, destroy };
      };

      beforeEach(() => {
        ioCallback = null; // never leak a prior test's observer callback
        vi.stubGlobal(
          'IntersectionObserver',
          class {
            constructor(cb) {
              ioCallback = cb;
            }
            observe() {}
            disconnect() {}
          },
        );
        vi.stubGlobal('cancelAnimationFrame', vi.fn());
        vi.stubGlobal(
          'requestAnimationFrame',
          vi.fn(() => 7),
        );
      });

      afterEach(() => {
        vi.unstubAllGlobals();
      });

      it('cancels the pending vanta frame when the hero leaves the viewport', async () => {
        const { vantaEffect } = await setup();
        ioCallback([{ isIntersecting: false }]);
        expect(cancelAnimationFrame).toHaveBeenCalledWith(vantaEffect.req);
      });

      it('resumes exactly once on re-entry (no double-schedule while running)', async () => {
        const { vantaEffect } = await setup();
        ioCallback([{ isIntersecting: false }]);
        ioCallback([{ isIntersecting: true }]);
        expect(vantaEffect.animationLoop).toHaveBeenCalledTimes(1);
        // Already running — further visible callbacks must be no-ops.
        ioCallback([{ isIntersecting: true }]);
        expect(vantaEffect.animationLoop).toHaveBeenCalledTimes(1);
      });

      it('pauses a loop that starts while the hero is off-screen (deep-link mount)', async () => {
        const { vantaEffect } = await setup(() => {
          ioCallback([{ isIntersecting: false }]); // observer reports before async init
        });
        expect(cancelAnimationFrame).toHaveBeenCalledWith(vantaEffect.req);
      });

      it('pauses while visibility is UNKNOWN and resumes on the first visible callback', async () => {
        // No observer callback has fired when the loader resolves — the
        // unknown state must pause the loop, and the first visible callback
        // must resume it exactly once (the unknown state is what guards the
        // deep-link race when the loader beats the observer).
        const { vantaEffect } = await setup();
        expect(cancelAnimationFrame).toHaveBeenCalledWith(vantaEffect.req);
        ioCallback([{ isIntersecting: true }]);
        expect(vantaEffect.animationLoop).toHaveBeenCalledTimes(1);
      });

      it('does not pause/resume after destroy', async () => {
        const { vantaEffect, destroy } = await setup(() => {
          // Confirm visible BEFORE the loop starts, so it is running (not
          // paused-at-creation) — then destroy must silence all callbacks.
          ioCallback([{ isIntersecting: true }]);
        });
        expect(cancelAnimationFrame).not.toHaveBeenCalled();
        destroy();
        ioCallback([{ isIntersecting: false }]);
        ioCallback([{ isIntersecting: true }]);
        expect(cancelAnimationFrame).not.toHaveBeenCalled();
        expect(vantaEffect.animationLoop).not.toHaveBeenCalled();
      });

      it('no-ops when IntersectionObserver is unavailable (loop runs as today)', async () => {
        vi.stubGlobal('IntersectionObserver', undefined);
        const { mockWavesConstructor } = await setup();
        // The stage still mounts and starts its loop, with nothing to pause.
        expect(mockWavesConstructor).toHaveBeenCalledTimes(1);
        expect(cancelAnimationFrame).not.toHaveBeenCalled();
      });
    });

    it('passes error to onError callback if dynamic loader fails', async () => {
      const el = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };

      const loadError = new Error('Chunk load failed');
      const mockLoader = vi.fn(async () => {
        throw loadError;
      });
      const onError = vi.fn();

      let scheduledTask = null;
      const scheduler = (fn) => {
        scheduledTask = fn;
      };

      initHeroWavesStage(el, {
        webgl: true,
        width: 1200,
        scheduler,
        loader: mockLoader,
        onError,
      });

      await scheduledTask();
      expect(onError).toHaveBeenCalledWith(loadError);
    });

    it('warns when the dynamic loader fails and no error callback was provided', async () => {
      const el = { addEventListener: vi.fn(), removeEventListener: vi.fn() };
      const loadError = new Error('Loader unavailable');
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      let scheduledTask;
      initHeroWavesStage(el, {
        width: 1200,
        scheduler: (task) => {
          scheduledTask = task;
        },
        loader: vi.fn(async () => {
          throw loadError;
        }),
      });

      await scheduledTask();

      expect(warn).toHaveBeenCalledWith('Vanta Waves init warning:', loadError);
    });
  });
});
