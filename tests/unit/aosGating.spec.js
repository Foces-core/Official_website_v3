import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { aosDisabled, initAOS } from '../../src/utils/aosGating.js';

vi.mock('aos', () => ({ default: { init: vi.fn() } }));
import AOS from 'aos';

// aosDisabled reads detectProfile(), which reads window.location.search,
// matchMedia and navigator at call time — stub those the same way the
// detectProfile suite does.
function setUrl(search) {
  window.history.replaceState({}, '', `/${search}`);
}

function stubNavigator({ connection = null, cores = 8, ram = 8 } = {}) {
  const nav = { hardwareConcurrency: cores, deviceMemory: ram };
  if (connection) nav.connection = connection;
  vi.stubGlobal('navigator', nav);
}

function stubReducedMotion(reduce) {
  vi.stubGlobal('matchMedia', (query) => ({
    matches: reduce && query === '(prefers-reduced-motion: reduce)',
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

beforeEach(() => {
  setUrl('');
  stubNavigator();
  stubReducedMotion(false);
});

afterEach(() => {
  vi.unstubAllGlobals();
  setUrl('');
});

describe('aosDisabled — motion and device gating', () => {
  it('keeps AOS enabled on a capable, motion-preferring device', () => {
    expect(aosDisabled()).toBe(false);
  });

  it('disables AOS when the OS requests reduced motion', () => {
    stubReducedMotion(true);
    expect(aosDisabled()).toBe(true);
  });

  it('disables AOS when ?motion=off forces reduced motion', () => {
    setUrl('?motion=off');
    expect(aosDisabled()).toBe(true);
  });

  it('keeps AOS enabled when ?motion=on overrides an OS reduce preference', () => {
    setUrl('?motion=on');
    stubReducedMotion(true);
    expect(aosDisabled()).toBe(false);
  });

  it('disables AOS under ?perf=slow (lowPower — the degrade-everything hammer)', () => {
    setUrl('?perf=slow');
    expect(aosDisabled()).toBe(true);
  });

  it('prefers the perf override when ?perf=slow and ?motion=on contradict', () => {
    setUrl('?perf=slow&motion=on');
    expect(aosDisabled()).toBe(true);
  });

  it('keeps AOS enabled under ?perf=high on a capable device', () => {
    setUrl('?perf=high');
    expect(aosDisabled()).toBe(false);
  });

  it('disables AOS on a low-spec device detected via heuristics (slow network)', () => {
    stubNavigator({ connection: { saveData: true, effectiveType: '4g', downlink: 10 } });
    expect(aosDisabled()).toBe(true);
  });
});

describe('aosDisabled — SSR guard', () => {
  it('returns false when window is undefined (SSR / pre-hydration)', () => {
    const savedWindow = globalThis.window;
    delete globalThis.window;
    try {
      expect(aosDisabled()).toBe(false);
    } finally {
      globalThis.window = savedWindow;
    }
  });
});

describe('initAOS — gate + init in one owner', () => {
  beforeEach(() => {
    document.body.classList.remove('aos-disabled');
    AOS.init.mockClear();
  });

  it('calls AOS.init with once:true and the resolved gate, and tags <body> when gated', () => {
    setUrl('?motion=off');
    expect(initAOS()).toBe(true);
    expect(AOS.init).toHaveBeenCalledWith({ once: true, disable: true });
    expect(document.body.classList.contains('aos-disabled')).toBe(true);
  });

  it('leaves <body> untagged and AOS enabled on a capable device', () => {
    setUrl('?perf=high');
    expect(initAOS()).toBe(false);
    expect(AOS.init).toHaveBeenCalledWith({ once: true, disable: false });
    expect(document.body.classList.contains('aos-disabled')).toBe(false);
  });
});
