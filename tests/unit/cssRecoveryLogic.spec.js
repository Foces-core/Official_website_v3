import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  CSS_RELOAD_KEY,
  CSS_PROBE_FAILSAFE_MS,
  cssLooksApplied,
  hasCssReloaded,
  shouldReloadForMissingCss,
  recordCssReload,
} from '../../src/utils/cssRecoveryLogic.js';

function memoryStorage() {
  const memory = new Map();
  return {
    getItem: (k) => memory.get(k) ?? null,
    setItem: (k, v) => memory.set(k, String(v)),
    removeItem: (k) => memory.delete(k),
  };
}

const onlineWin = () => ({ navigator: { onLine: true }, location: { reload: vi.fn() } });
const offlineWin = () => ({ navigator: { onLine: false }, location: { reload: vi.fn() } });

describe('cssRecoveryLogic unstyled-boot recovery', () => {
  let storage;

  beforeEach(() => {
    storage = memoryStorage();
  });

  it('exposes a sane failsafe window', () => {
    expect(CSS_PROBE_FAILSAFE_MS).toBeGreaterThanOrEqual(3000);
  });

  describe('cssLooksApplied', () => {
    it('accepts the index.css body background in any engine spacing/case', () => {
      expect(cssLooksApplied('rgb(16, 16, 17)')).toBe(true);
      expect(cssLooksApplied('rgb(16,16,17)')).toBe(true);
      expect(cssLooksApplied('rgb( 16,  16,  17 )')).toBe(true);
      expect(cssLooksApplied('RGB(16, 16, 17)')).toBe(true);
    });

    it('rejects the transparent body of a stylesheet-less boot', () => {
      expect(cssLooksApplied('rgba(0, 0, 0, 0)')).toBe(false);
      expect(cssLooksApplied('transparent')).toBe(false);
    });

    it('rejects foreign backgrounds, blanks, and non-strings', () => {
      expect(cssLooksApplied('rgb(255, 255, 255)')).toBe(false);
      expect(cssLooksApplied('rgba(16, 16, 17, 1)')).toBe(false);
      expect(cssLooksApplied('')).toBe(false);
      expect(cssLooksApplied(null)).toBe(false);
      expect(cssLooksApplied(undefined)).toBe(false);
      expect(cssLooksApplied(42)).toBe(false);
    });
  });

  describe('session guard', () => {
    it('allows the reload on first missing-css detection', () => {
      expect(hasCssReloaded({ storage })).toBe(false);
      expect(shouldReloadForMissingCss({ storage })).toBe(true);
    });

    it('blocks a second reload once the flag is spent', () => {
      // Literal flag value (not the export): the key is a cross-load
      // contract — renaming it must break a test, not slip through.
      storage.setItem('foces:css-auto-reloaded', '1');
      expect(hasCssReloaded({ storage })).toBe(true);
      expect(shouldReloadForMissingCss({ storage })).toBe(false);
    });
  });

  describe('recordCssReload', () => {
    it('stamps the flag and reloads through the injected hook', () => {
      const reloadFn = vi.fn();
      recordCssReload({ storage, win: onlineWin(), reloadFn });
      expect(storage.getItem(CSS_RELOAD_KEY)).toBe('1');
      expect(reloadFn).toHaveBeenCalledTimes(1);
    });

    it('reloads through win.location when no hook is given', () => {
      const win = onlineWin();
      recordCssReload({ storage, win });
      expect(win.location.reload).toHaveBeenCalledTimes(1);
      expect(storage.getItem(CSS_RELOAD_KEY)).toBe('1');
    });

    it('tolerates a win without a reload function', () => {
      recordCssReload({ storage, win: { navigator: { onLine: true } } });
      expect(storage.getItem(CSS_RELOAD_KEY)).toBe('1');
    });

    it('never calls win.location.reload when it is not a function', () => {
      const win = { navigator: { onLine: true }, location: {} };
      expect(() => recordCssReload({ storage, win })).not.toThrow();
      expect(storage.getItem(CSS_RELOAD_KEY)).toBe('1');
    });

    it('is a silent no-op offline — flag untouched, no reload', () => {
      const win = offlineWin();
      const reloadFn = vi.fn();
      recordCssReload({ storage, win, reloadFn });
      expect(reloadFn).not.toHaveBeenCalled();
      expect(win.location.reload).not.toHaveBeenCalled();
      expect(storage.getItem(CSS_RELOAD_KEY)).toBeNull();
    });

    it('does not reload twice in one session', () => {
      storage.setItem('foces:css-auto-reloaded', '1');
      const reloadFn = vi.fn();
      recordCssReload({ storage, win: onlineWin(), reloadFn });
      expect(reloadFn).not.toHaveBeenCalled();
    });
  });
});
