import { describe, it, expect } from 'vitest';
import {
  getErrorCode,
  purgeAppCaches,
  unregisterServiceWorkers,
} from '../../src/utils/cacheRecovery.js';

describe('cacheRecovery', () => {
  it('getErrorCode prefixes chunk-like errors with CHUNK', () => {
    expect(getErrorCode(new Error('Loading chunk 5 failed'))).toMatch(/^CHUNK-[0-9A-Z]{6}$/);
    expect(getErrorCode(new Error("Unexpected token '<'"))).toMatch(/^CHUNK-/);
    expect(getErrorCode(new Error('Failed to load module script'))).toMatch(/^CHUNK-/);
  });

  it('getErrorCode prefixes genuine crashes with APP and is stable', () => {
    const first = getErrorCode(new TypeError('x is not a function'));
    const second = getErrorCode(new TypeError('x is not a function'));
    expect(first).toMatch(/^APP-[0-9A-Z]{6}$/);
    expect(first).toBe(second);
    expect(getErrorCode(null)).toMatch(/^APP-/);
    expect(getErrorCode('plain string')).toMatch(/^APP-/);
  });

  it('purgeAppCaches deletes every cache and counts them', async () => {
    const deleted = [];
    const fakeCaches = {
      keys: () => Promise.resolve(['chunks-cache-v1', 'images-cache-v2']),
      delete: (key) => {
        deleted.push(key);
        return Promise.resolve(true);
      },
    };
    expect(await purgeAppCaches({ caches: fakeCaches })).toBe(2);
    expect(deleted).toEqual(['chunks-cache-v1', 'images-cache-v2']);
  });

  it('purgeAppCaches is zero-throw without cache support', async () => {
    expect(await purgeAppCaches({ caches: null })).toBe(0);
    expect(await purgeAppCaches()).toBe(0);
    const failing = {
      keys: () => Promise.reject(new Error('denied')),
      delete: () => Promise.resolve(true),
    };
    expect(await purgeAppCaches({ caches: failing })).toBe(0);
  });

  it('unregisterServiceWorkers removes every registration', async () => {
    const worker = {
      getRegistrations: () =>
        Promise.resolve([
          { unregister: () => Promise.resolve(true) },
          { unregister: () => Promise.resolve(false) },
        ]),
    };
    expect(await unregisterServiceWorkers({ worker })).toBe(1);
  });

  it('unregisterServiceWorkers is zero-throw without SW support', async () => {
    expect(await unregisterServiceWorkers({ worker: null })).toBe(0);
    expect(await unregisterServiceWorkers()).toBe(0);
    const failing = {
      getRegistrations: () => Promise.reject(new Error('denied')),
    };
    expect(await unregisterServiceWorkers({ worker: failing })).toBe(0);
  });
});
