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
