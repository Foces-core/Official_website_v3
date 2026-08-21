import { describe, it, expect } from 'vitest';
import {
  isChunkError,
  createChunkRecovery,
  tryImportWithRetry,
} from '../../src/utils/chunkRecovery.js';

describe('chunkRecovery', () => {
  it('isChunkError detects chunk messages', () => {
    expect(isChunkError(new Error('Loading chunk 5 failed'))).toBe(true);
    expect(isChunkError(new Error('Failed to fetch dynamically imported module'))).toBe(true);
    expect(isChunkError(new Error('ChunkLoadError'))).toBe(true);
    expect(isChunkError(new Error('Real error'))).toBe(false);
    expect(isChunkError('Loading chunk 1 failed')).toBe(true);
    expect(isChunkError(null)).toBe(false);
  });

  it('createChunkRecovery returns helpers', () => {
    const recovery = createChunkRecovery({ storage: null, win: null });
    expect(typeof recovery.hasReloaded).toBe('function');
    expect(typeof recovery.recordReload).toBe('function');
    expect(typeof recovery.clear).toBe('function');
    expect(recovery.isChunkError).toBe(isChunkError);
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
});
