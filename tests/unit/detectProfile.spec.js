import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import detectProfile from '../../src/utils/detectProfile.js';

/**
 * detectProfile reads window.location.search, localStorage, navigator.connection
 * / hardwareConcurrency / deviceMemory / userAgentData, and window.matchMedia
 * at CALL time — so each test stubs those globals and asserts the profile.
 */

function setUrl(search) {
  window.history.replaceState({}, '', `/${search}`);
}

function setStorage(key, value) {
  if (value == null) window.localStorage.removeItem(key);
  else window.localStorage.setItem(key, value);
}

// Replace navigator with a configurable stub. jsdom's navigator is read-only
// via assignment, so stub the whole global.
function stubNavigator({ connection = null, cores = 8, ram = 8, uaData = null } = {}) {
  const nav = { hardwareConcurrency: cores, deviceMemory: ram };
  if (connection) nav.connection = connection;
  if (uaData) nav.userAgentData = uaData;
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
  setStorage('perfOverride', null);
  setStorage('motionOverride', null);
  stubNavigator();
  stubReducedMotion(false);
});

afterEach(() => {
  vi.unstubAllGlobals();
  setUrl('');
});

describe('detectProfile — URL/localStorage overrides', () => {
  it('?perf=slow forces every constraint on (except reducedMotion — that is a motion override, not a perf claim)', () => {
    setUrl('?perf=slow');
    expect(detectProfile()).toEqual({
      slowNetwork: true,
      lowCPU: true,
      reducedMotion: false,
      lowPower: true,
    });
  });

  it('?perf=high forces all constraints off, on a capable device', () => {
    setUrl('?perf=high');
    expect(detectProfile()).toEqual({
      slowNetwork: false,
      lowCPU: false,
      reducedMotion: false,
      lowPower: false,
    });
  });

  it('?perf=high still respects the OS reduced-motion preference', () => {
    setUrl('?perf=high');
    stubReducedMotion(true);
    const profile = detectProfile();
    expect(profile.slowNetwork).toBe(false);
    expect(profile.lowCPU).toBe(false);
    expect(profile.lowPower).toBe(false);
    expect(profile.reducedMotion).toBe(true);
  });

  it('?motion=off forces reducedMotion even when the OS prefers motion', () => {
    setUrl('?motion=off');
    expect(detectProfile().reducedMotion).toBe(true);
  });

  it('?motion=on overrides an OS prefers-reduced-motion preference', () => {
    setUrl('?motion=on');
    stubReducedMotion(true);
    expect(detectProfile().reducedMotion).toBe(false);
  });

  it('?perf=slow beats a ?motion=on request (perf wins for reducedMotion)', () => {
    setUrl('?perf=slow&motion=on');
    expect(detectProfile().reducedMotion).toBe(false);
    expect(detectProfile().lowPower).toBe(true);
  });

  it('falls back to the localStorage override when no URL param is present', () => {
    setStorage('perfOverride', 'slow');
    const profile = detectProfile();
    expect(profile.slowNetwork).toBe(true);
    expect(profile.lowPower).toBe(true);
  });

  it('ignores unknown URL param values', () => {
    setUrl('?perf=banana&motion=sideways');
    expect(detectProfile()).toEqual({
      slowNetwork: false,
      lowCPU: false,
      reducedMotion: false,
      lowPower: false,
    });
  });
});

describe('detectProfile — network heuristics', () => {
  it('saveData marks the profile slow', () => {
    stubNavigator({ connection: { saveData: true, effectiveType: '4g', downlink: 10 } });
    expect(detectProfile().slowNetwork).toBe(true);
    expect(detectProfile().lowPower).toBe(true);
  });

  it('a 2g effective type marks the profile slow', () => {
    stubNavigator({ connection: { saveData: false, effectiveType: '2g', downlink: 10 } });
    expect(detectProfile().slowNetwork).toBe(true);
  });

  it('a low downlink (< 1.2 Mbps) marks the profile slow', () => {
    stubNavigator({ connection: { saveData: false, effectiveType: '3g', downlink: 1.0 } });
    expect(detectProfile().slowNetwork).toBe(true);
  });

  it('a fast 4g connection does not mark the profile slow', () => {
    stubNavigator({ connection: { saveData: false, effectiveType: '4g', downlink: 20 } });
    expect(detectProfile().slowNetwork).toBe(false);
  });

  it('a missing connection object is not treated as slow', () => {
    stubNavigator({ connection: null });
    expect(detectProfile().slowNetwork).toBe(false);
  });
});

describe('detectProfile — CPU heuristics', () => {
  it('a mobile-sized viewport (matchMedia max-width: 767px) marks lowCPU', () => {
    vi.stubGlobal('matchMedia', (query) => ({
      matches: query === '(max-width: 767px)',
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    expect(detectProfile().lowCPU).toBe(true);
  });

  it('few cores AND low RAM (fallback path, no userAgentData) mark lowCPU', () => {
    stubNavigator({ cores: 4, ram: 4 });
    expect(detectProfile().lowCPU).toBe(true);
  });

  it('many cores with low RAM does NOT mark lowCPU (high-end phones)', () => {
    stubNavigator({ cores: 8, ram: 4 });
    expect(detectProfile().lowCPU).toBe(false);
  });

  it('a desktop platform via userAgentData never marks lowCPU on its own', () => {
    stubNavigator({
      cores: 4,
      ram: 4,
      uaData: { platform: 'Windows', getHighEntropyValues: () => Promise.resolve({}) },
    });
    expect(detectProfile().lowCPU).toBe(false);
  });

  it('an Android platform via userAgentData still applies the low-spec test', () => {
    stubNavigator({
      cores: 4,
      ram: 4,
      uaData: { platform: 'Android', getHighEntropyValues: () => Promise.resolve({}) },
    });
    expect(detectProfile().lowCPU).toBe(true);
  });
});

describe('detectProfile — SSR guard', () => {
  it('returns an all-false profile when window is undefined (SSR)', () => {
    // The module's first line guards non-browser environments; jsdom always
    // defines window, so temporarily remove it to exercise that branch.
    const savedWindow = globalThis.window;
    delete globalThis.window;
    try {
      expect(detectProfile()).toEqual({
        slowNetwork: false,
        lowCPU: false,
        reducedMotion: false,
        lowPower: false,
      });
    } finally {
      globalThis.window = savedWindow;
    }
  });
});

describe('detectProfile — composition', () => {
  it('lowPower is true when any constraint holds', () => {
    stubNavigator({ connection: { saveData: true } });
    expect(detectProfile().lowPower).toBe(true);
  });

  it('lowPower is true when the OS requests reduced motion', () => {
    stubReducedMotion(true);
    expect(detectProfile().reducedMotion).toBe(true);
    expect(detectProfile().lowPower).toBe(true);
  });

  it('a capable, motion-preferring device gets all flags false', () => {
    stubNavigator({
      connection: { saveData: false, effectiveType: '4g', downlink: 20 },
      cores: 12,
      ram: 16,
    });
    stubReducedMotion(false);
    expect(detectProfile()).toEqual({
      slowNetwork: false,
      lowCPU: false,
      reducedMotion: false,
      lowPower: false,
    });
  });
});
