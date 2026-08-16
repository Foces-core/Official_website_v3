import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  aosDisabled,
  initAOS,
  shouldForceShowAos,
  stuckAosInView,
  startAosFailsafe,
  stopAosFailsafe,
} from '../../src/utils/aosGating.js';

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

  it('still inits AOS when <body> is not in the document yet', () => {
    // The body-tag step is optional; AOS.init must still run (and not throw)
    // when the gate is evaluated before hydration attaches <body>.
    const bodyDesc = Object.getOwnPropertyDescriptor(document, 'body');
    Object.defineProperty(document, 'body', { value: null, configurable: true });
    try {
      expect(() => initAOS()).not.toThrow();
      expect(AOS.init).toHaveBeenCalledWith({ once: true, disable: false });
    } finally {
      if (bodyDesc) Object.defineProperty(document, 'body', bodyDesc);
      else delete document.body;
    }
  });
});

describe('AOS failsafe — content can never stay hidden on capable devices', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.body.classList.remove('aos-disabled');
    stopAosFailsafe(); // clear any watch an initAOS test left running
  });

  afterEach(() => {
    stopAosFailsafe();
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

  it('force-shows a [data-aos] element that is in the viewport but lacks .aos-animate', () => {
    const el = addStuck('in-view', 100);
    expect(shouldForceShowAos(el, 800)).toBe(true);
    startAosFailsafe();
    expect(el.classList.contains('aos-animate')).toBe(true);
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

  it('the cleanup handle detaches the listeners (no force-show after cleanup)', () => {
    const cleanup = startAosFailsafe();
    cleanup();
    // Added AFTER the watch started and stopped: the boot run never saw it,
    // and a synthetic scroll must not reveal it either.
    const el = addStuck('in-view', 100);
    window.dispatchEvent(new Event('scroll'));
    expect(el.classList.contains('aos-animate')).toBe(false);
  });
});
