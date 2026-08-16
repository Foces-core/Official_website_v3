import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  shouldInitHeroWaves,
  initHeroWavesStage,
  VANTA_WAVES_CONFIG,
} from '../../src/Components/HeroStage/heroWavesStage.js';

describe('heroWavesStage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('shouldInitHeroWaves', () => {
    it('returns false when lowPower is true regardless of width', () => {
      expect(shouldInitHeroWaves({ lowPower: true, width: 1440 })).toBe(false);
      expect(shouldInitHeroWaves({ lowPower: true, width: 375 })).toBe(false);
    });

    it('returns false for mobile / tablet widths (< 1024)', () => {
      expect(shouldInitHeroWaves({ lowPower: false, width: 375 })).toBe(false);
      expect(shouldInitHeroWaves({ lowPower: false, width: 768 })).toBe(false);
      expect(shouldInitHeroWaves({ lowPower: false, width: 1023 })).toBe(false);
    });

    it('returns true for desktop-wide widths (>= 1024) on normal devices', () => {
      expect(shouldInitHeroWaves({ lowPower: false, width: 1024 })).toBe(true);
      expect(shouldInitHeroWaves({ lowPower: false, width: 1920 })).toBe(true);
    });
  });

  describe('initHeroWavesStage', () => {
    it('returns a no-op cleanup when container or conditions are invalid', () => {
      const destroy1 = initHeroWavesStage(null);
      expect(typeof destroy1).toBe('function');
      destroy1();

      const el = { addEventListener: vi.fn(), removeEventListener: vi.fn() };
      const destroy2 = initHeroWavesStage(el, { lowPower: true, width: 1440 });
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
        lowPower: false,
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
      expect(mockVantaInstance.destroy).toHaveBeenCalledTimes(1);
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
        lowPower: false,
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
          lowPower: false,
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
        lowPower: false,
        width: 1200,
        scheduler,
        loader: mockLoader,
        onError,
      });

      await scheduledTask();
      expect(onError).toHaveBeenCalledWith(loadError);
    });
  });
});
