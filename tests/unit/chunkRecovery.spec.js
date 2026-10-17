import { describe, it, expect, vi } from 'vitest';
import {
  isChunkError,
  createChunkRecovery,
  tryImportWithRetry,
} from '../../src/utils/chunkRecovery.js';

describe('chunkRecovery', () => {
  function makeStorage() {
    const values = new Map();
    return {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, String(value)),
      removeItem: (key) => values.delete(key),
    };
  }

  it('isChunkError detects chunk messages', () => {
    expect(isChunkError(new Error('Loading chunk 5 failed'))).toBe(true);
    expect(isChunkError(new Error('Failed to fetch dynamically imported module'))).toBe(true);
    expect(isChunkError(new Error('ChunkLoadError'))).toBe(true);
    expect(isChunkError(new Error('Real error'))).toBe(false);
    expect(isChunkError('Loading chunk 1 failed')).toBe(true);
    expect(isChunkError(null)).toBe(false);
    const misleadingObject = { toString: () => 'Loading chunk 1 failed' };
    expect(isChunkError(misleadingObject)).toBe(false);
  });

  it('isChunkError detects the HTML-as-JS signature (stale chunk served index.html)', () => {
    expect(isChunkError(new Error("Unexpected token '<'"))).toBe(true);
    expect(isChunkError(new Error('Unexpected token <'))).toBe(true);
    expect(isChunkError(new Error('Failed to load module script'))).toBe(true);
    expect(isChunkError(new Error('Expected a JavaScript module script'))).toBe(true);
    expect(isChunkError(new Error("MIME type ('text/html') is not executable"))).toBe(true);
    expect(isChunkError(new Error('server responded with text/html'))).toBe(true);
    expect(isChunkError(new Error('plain text failure'))).toBe(false);
    expect(isChunkError(new Error('Unexpected token export'))).toBe(false);
  });

  it('createChunkRecovery binds its helpers to the supplied storage and window', () => {
    const storage = makeStorage();
    const reload = vi.fn();
    const recovery = createChunkRecovery({
      storage,
      win: { navigator: { onLine: true }, location: { reload } },
    });
    expect(typeof recovery.hasReloaded).toBe('function');
    expect(typeof recovery.recordReload).toBe('function');
    expect(typeof recovery.clear).toBe('function');
    expect(typeof recovery.shouldAutoReload).toBe('function');
    expect(recovery.isChunkError).toBe(isChunkError);
    expect(recovery.hasReloaded()).toBe(false);
    expect(recovery.shouldAutoReload()).toBe(true);

    recovery.recordReload();
    expect(storage.getItem('chunk-reload-retry')).toBe('true');
    expect(reload).toHaveBeenCalledOnce();
    expect(recovery.hasReloaded()).toBe(true);

    recovery.clear();
    expect(storage.getItem('chunk-reload-retry')).toBeNull();
  });

  it('tryImportWithRetry succeeds on first try', async () => {
    const mod = { default: {} };
    const fn = () => Promise.resolve(mod);
    const result = await tryImportWithRetry(fn, false);
    expect(result).toBe(mod);
  });

  it('tryImportWithRetry retries on chunk error', async () => {
    let calls = 0;
    const mod = { default: {} };
    const fn = () => {
      calls += 1;
      if (calls === 1) return Promise.reject(new Error('Loading chunk 1 failed'));
      return Promise.resolve(mod);
    };
    const result = await tryImportWithRetry(fn, false);
    expect(result).toBe(mod);
    expect(calls).toBe(2);
  });

  it('surfaces the retry error and records a reload guard only when one is needed', async () => {
    const key = 'chunk-retry:contact';
    const storage = makeStorage();
    const reload = vi.fn();
    vi.stubGlobal('window', {
      sessionStorage: storage,
      navigator: { onLine: true },
      location: { reload },
    });
    const importFn = () => Promise.reject(new Error('still unavailable'));

    try {
      await expect(tryImportWithRetry(importFn, false, key)).rejects.toThrow('still unavailable');
      expect(storage.getItem(key)).toBe('true');
      expect(reload).toHaveBeenCalledOnce();

      storage.removeItem(key);
      reload.mockClear();
      await expect(tryImportWithRetry(importFn, true, key)).rejects.toThrow('still unavailable');
      expect(storage.getItem(key)).toBeNull();
      expect(reload).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
