import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  AUTO_RELOAD_KEY,
  CHUNK_RETRY_KEY,
  isOffline,
  shouldAutoReloadOnError,
  scheduleErrorAutoReload,
  resetErrorAutoReload,
  hasLazyChunkReloaded,
  recordLazyChunkReload,
  clearLazyChunkRetry,
} from '../../src/utils/errorRecoveryLogic.js';

describe('errorRecoveryLogic auto-reload policies', () => {
  let memory;
  let mockStorage;

  beforeEach(() => {
    vi.useFakeTimers();
    memory = new Map();
    mockStorage = {
      getItem: (k) => memory.get(k) ?? null,
      setItem: (k, v) => memory.set(k, String(v)),
      removeItem: (k) => memory.delete(k),
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Error Boundary auto-reload policy', () => {
    it('allows auto-reload on first error and arms timer', () => {
      const reloadFn = vi.fn();
      expect(shouldAutoReloadOnError({ storage: mockStorage })).toBe(true);

      const cancel = scheduleErrorAutoReload({
        storage: mockStorage,
        delayMs: 1000,
        reloadFn,
      });

      expect(mockStorage.getItem(AUTO_RELOAD_KEY)).toBe('1');
      expect(reloadFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1000);
      expect(reloadFn).toHaveBeenCalledTimes(1);

      cancel();
    });

    it('blocks subsequent auto-reloads once flag is set to prevent reload loops', () => {
      mockStorage.setItem(AUTO_RELOAD_KEY, '1');
      const reloadFn = vi.fn();

      expect(shouldAutoReloadOnError({ storage: mockStorage })).toBe(false);

      const cancel = scheduleErrorAutoReload({
        storage: mockStorage,
        delayMs: 1000,
        reloadFn,
      });

      vi.advanceTimersByTime(2000);
      expect(reloadFn).not.toHaveBeenCalled();

      cancel();
    });

    it('cancel handle aborts pending auto-reload timer', () => {
      const reloadFn = vi.fn();
      const cancel = scheduleErrorAutoReload({
        storage: mockStorage,
        delayMs: 1000,
        reloadFn,
      });

      cancel();
      vi.advanceTimersByTime(2000);
      expect(reloadFn).not.toHaveBeenCalled();
    });

    it('resets the error auto-reload flag', () => {
      mockStorage.setItem(AUTO_RELOAD_KEY, '1');
      resetErrorAutoReload({ storage: mockStorage });
      expect(mockStorage.getItem(AUTO_RELOAD_KEY)).toBeNull();
    });
  });

  describe('Lazy chunk recovery policy', () => {
    it('detects if chunk retry already reloaded', () => {
      expect(hasLazyChunkReloaded({ storage: mockStorage })).toBe(false);
      mockStorage.setItem(CHUNK_RETRY_KEY, 'true');
      expect(hasLazyChunkReloaded({ storage: mockStorage })).toBe(true);
    });

    it('records chunk reload and triggers reloadFn', () => {
      const reloadFn = vi.fn();
      recordLazyChunkReload({ storage: mockStorage, reloadFn });
      expect(mockStorage.getItem(CHUNK_RETRY_KEY)).toBe('true');
      expect(reloadFn).toHaveBeenCalledTimes(1);
    });

    it('clears chunk retry flag', () => {
      mockStorage.setItem(CHUNK_RETRY_KEY, 'true');
      clearLazyChunkRetry({ storage: mockStorage });
      expect(mockStorage.getItem(CHUNK_RETRY_KEY)).toBeNull();
    });
  });

  describe('Offline policy — a reload without connection can never recover', () => {
    const offlineWin = () => ({
      navigator: { onLine: false },
      location: { reload: vi.fn() },
    });

    it('detects an explicitly offline window, and only that', () => {
      expect(isOffline(offlineWin())).toBe(true);
      expect(isOffline({ navigator: { onLine: true } })).toBe(false);
      expect(isOffline({})).toBe(false);
      expect(isOffline(null)).toBe(false);
    });

    it('skips the error-boundary auto-reload offline without consuming the flag', () => {
      const win = offlineWin();
      const reloadFn = vi.fn();
      const cancel = scheduleErrorAutoReload({ storage: mockStorage, win, reloadFn });
      cancel();
      expect(reloadFn).not.toHaveBeenCalled();
      // Flag untouched: a later ONLINE failure still gets its one reload.
      expect(mockStorage.getItem(AUTO_RELOAD_KEY)).toBeNull();
    });

    it('skips the chunk recovery reload offline without consuming the flag', () => {
      const win = offlineWin();
      const reloadFn = vi.fn();
      recordLazyChunkReload({ storage: mockStorage, win, reloadFn });
      expect(reloadFn).not.toHaveBeenCalled();
      expect(mockStorage.getItem(CHUNK_RETRY_KEY)).toBeNull();
    });
  });
});
