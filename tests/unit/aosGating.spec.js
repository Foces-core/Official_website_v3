import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  aosDisabled,
  initAOS,
  shouldForceShowAos,
  stuckAosInView,
} from '../../src/utils/aosGating.js';

// No 'aos' module mock: src no longer statically imports the library (it is
// fetched on demand), so specs inject a fake loader instead — which also
// proves the entry chunk stays free of it.

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

describe('initAOS — gate + lazy init in one owner', () => {
  beforeEach(() => {
    document.body.classList.remove('aos-disabled');
  });

  const resolvingLoader = (init) => () => Promise.resolve({ init });

  it('never downloads the library when gated, and tags <body>', async () => {
    setUrl('?motion=off');
    const loadAos = vi.fn();
    expect(initAOS({ loadAos })).toBe(true);
    expect(loadAos).not.toHaveBeenCalled();
    expect(document.body.classList.contains('aos-disabled')).toBe(true);
  });

  it('fetches the library on capable devices and inits it un-disabled', async () => {
    setUrl('?perf=high');
    const init = vi.fn();
    expect(initAOS({ loadAos: resolvingLoader(init) })).toBe(false);
    expect(document.body.classList.contains('aos-disabled')).toBe(false);
    await vi.waitFor(() => {
      expect(init).toHaveBeenCalledWith({ once: true, disable: false });
    });
  });

  it('still tags <body> and kicks the fetch when <body> is missing', async () => {
    // The body-tag step is optional; the gate + fetch must still run (and not
    // throw) when evaluated before hydration attaches <body>.
    const bodyDesc = Object.getOwnPropertyDescriptor(document, 'body');
    Object.defineProperty(document, 'body', { value: null, configurable: true });
    const loadAos = vi.fn(() => Promise.resolve({ init: () => {} }));
    try {
      expect(() => initAOS({ loadAos })).not.toThrow();
      expect(loadAos).toHaveBeenCalled();
    } finally {
      if (bodyDesc) Object.defineProperty(document, 'body', bodyDesc);
      else delete document.body;
    }
  });

  it('survives the library init throwing — the app must boot and the failsafe still covers reveals', async () => {
    // A failed init must not take the boot down. The viewport failsafe in
    // useAosFailsafe force-shows in-view content instead.
    const init = vi.fn(() => {
      throw new Error('AOS broke');
    });
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(initAOS({ loadAos: resolvingLoader(init) })).toBe(false);
      await vi.waitFor(() => {
        expect(console.error).toHaveBeenCalled();
      });
      expect(document.body.classList.contains('aos-disabled')).toBe(false);
    } finally {
      spy.mockRestore();
    }
  });

  it('stays silent when the library fetch itself fails (offline/blocked)', async () => {
    // A rejected fetch means offline or an ad-blocker — the failsafe covers
    // reveals, and logging noise for an expected condition helps nobody.
    const loadAos = () => Promise.reject(new Error('offline'));
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(initAOS({ loadAos })).toBe(false);
      // Flush the rejection through the handled path, then assert silence.
      await Promise.resolve();
      await Promise.resolve();
      expect(spy).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });
});

describe('AOS failsafe decisions — pure viewport math', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.body.classList.remove('aos-disabled');
  });

  const addStuck = (id, top, height = 100) => {
    const el = document.createElement('div');
    el.setAttribute('data-aos', 'fade-up');
    el.id = id;
    // jsdom does no layout, so getBoundingClientRect is all zeros — stub it
    // to the element's declared top/height so viewport math is testable.
    el.getBoundingClientRect = () => ({ top, bottom: top + height, left: 0, right: 0 });
    document.body.appendChild(el);
    return el;
  };

  it('identifies a [data-aos] element that is in the viewport but lacks .aos-animate', () => {
    const el = addStuck('in-view', 100);
    expect(shouldForceShowAos(el, 800)).toBe(true);
  });

  it('leaves below-the-fold elements hidden (AOS still owns the scroll reveal)', () => {
    const el = addStuck('below-fold', 5000);
    expect(shouldForceShowAos(el, 800)).toBe(false);
    stuckAosInView(800);
    expect(el.classList.contains('aos-animate')).toBe(false);
  });

  it('ignores elements AOS already revealed', () => {
    const el = addStuck('already-animated', 100);
    el.classList.add('aos-animate');
    expect(shouldForceShowAos(el, 800)).toBe(false);
  });

  it('stuckAosInView returns exactly the in-view, unrevealed elements', () => {
    const inView = addStuck('a', 100);
    addStuck('b', 5000);
    const done = addStuck('c', 200);
    done.classList.add('aos-animate');
    expect(stuckAosInView(800).map((el) => el.id)).toEqual(['a']);
    expect(inView.classList.contains('aos-animate')).toBe(false);
  });

  it('does not read window in default parameters (server-side calls return [] instead of throwing)', () => {
    // shouldForceShowAos/stuckAosInView must not touch window before the
    // environment guard — a SSR call used to throw ReferenceError at the
    // default-parameter evaluation.
    const savedWindow = globalThis.window;
    delete globalThis.window;
    try {
      expect(shouldForceShowAos(null, undefined)).toBe(false);
      expect(stuckAosInView()).toEqual([]);
    } finally {
      globalThis.window = savedWindow;
    }
  });
});
