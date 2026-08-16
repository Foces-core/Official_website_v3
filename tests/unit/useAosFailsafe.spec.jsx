import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import useAosFailsafe from '../../src/hooks/useAosFailsafe.js';
import { createHarness } from './harness.jsx';

// useAosFailsafe owns the browser lifecycle of the AOS viewport failsafe; the
// pure decisions (shouldForceShowAos / stuckAosInView) are covered in
// aosGating.spec.js. Here we verify the hook wiring: it starts the watch on
// capable devices (boot force-show of in-view stuck elements), skips gated
// devices entirely (the body.aos-disabled CSS net covers them), and detaches
// listeners on unmount.

// aosDisabled reads detectProfile() (window.location.search, matchMedia,
// navigator) at effect time — stub them the same way aosGating.spec does.
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

// jsdom does no layout, so getBoundingClientRect is all zeros — stub it to the
// element's declared top/height so viewport math is testable.
function addStuck(id, top, height = 100) {
  const el = document.createElement('div');
  el.setAttribute('data-aos', 'fade-up');
  el.id = id;
  el.getBoundingClientRect = () => ({ top, bottom: top + height, left: 0, right: 0 });
  document.body.appendChild(el);
  return el;
}

function FailsafeProbe() {
  useAosFailsafe();
  return <div className="failsafe-probe" />;
}

let harness;

// The watch schedules force-show via rAF. Capture the callbacks into a queue
// instead of running them synchronously — tests flush explicitly, and the
// teardown test can prove an in-flight frame is cancelled on unmount.
let rafQueue = [];
const flushRaf = () => {
  const q = rafQueue;
  rafQueue = [];
  q.forEach((cb) => cb && cb());
};

beforeEach(() => {
  setUrl('');
  stubNavigator();
  stubReducedMotion(false);
  rafQueue = [];
  vi.stubGlobal('requestAnimationFrame', (cb) => {
    rafQueue.push(cb);
    return rafQueue.length;
  });
  vi.stubGlobal('cancelAnimationFrame', (id) => {
    rafQueue[id - 1] = null; // a cancelled frame must not run on flush
  });
  document.body.innerHTML = '';
  harness = createHarness();
});

afterEach(() => {
  harness.unmount();
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
  setUrl('');
});

describe('useAosFailsafe — capable device', () => {
  it('force-shows an in-view [data-aos] element AOS left hidden (boot run)', () => {
    const el = addStuck('in-view', 100);
    harness.render(<FailsafeProbe />);
    expect(el.classList.contains('aos-animate')).toBe(true);
  });

  it('leaves below-the-fold elements hidden (AOS still owns the scroll reveal)', () => {
    addStuck('below-fold', 5000);
    harness.render(<FailsafeProbe />);
    const el = document.getElementById('below-fold');
    expect(el.classList.contains('aos-animate')).toBe(false);
  });

  it('observes post-boot insertions — an in-view [data-aos] element is revealed without any viewport event', async () => {
    harness.render(<FailsafeProbe />);
    // The boot run already passed, so this element is only caught by the
    // MutationObserver (scroll-gated lazy sections mount their elements
    // after boot; no scroll/resize may ever fire for them).
    const el = addStuck('late', 100);
    expect(el.classList.contains('aos-animate')).toBe(false);
    // MutationObserver delivers asynchronously — let the microtask run, then
    // flush the rAF frame the observer scheduled.
    await new Promise((resolve) => setTimeout(resolve, 0));
    flushRaf();
    expect(el.classList.contains('aos-animate')).toBe(true);
  });

  it('a scroll reveals a stuck below-fold element once it enters the viewport', () => {
    const el = addStuck('below-fold', 5000);
    harness.render(<FailsafeProbe />);
    expect(el.classList.contains('aos-animate')).toBe(false);
    el.getBoundingClientRect = () => ({ top: 100, bottom: 200, left: 0, right: 0 });
    window.dispatchEvent(new Event('scroll'));
    flushRaf();
    expect(el.classList.contains('aos-animate')).toBe(true);
  });
});

describe('useAosFailsafe — gated device', () => {
  it('does not start the watch (body.aos-disabled CSS net covers reveals)', () => {
    setUrl('?motion=off');
    const el = addStuck('in-view', 100);
    harness.render(<FailsafeProbe />);
    expect(el.classList.contains('aos-animate')).toBe(false);
    // And no listeners are attached: a scroll must not reveal it either.
    window.dispatchEvent(new Event('scroll'));
    expect(el.classList.contains('aos-animate')).toBe(false);
  });
});

describe('useAosFailsafe — teardown', () => {
  it('cancels work queued while mounted AND stops catching new insertions after unmount', async () => {
    harness.render(<FailsafeProbe />);
    // Queue a force-show frame while the watch is still alive: an in-view
    // stuck element plus a scroll. The frame must be CANCELLED by cleanup.
    const before = addStuck('queued-before-unmount', 100);
    window.dispatchEvent(new Event('scroll'));
    expect(rafQueue.some(Boolean)).toBe(true); // work really was scheduled
    harness.unmount();
    // Added AFTER the watch stopped: the MutationObserver must be gone too.
    const after = addStuck('inserted-after-unmount', 100);
    await new Promise((resolve) => setTimeout(resolve, 0)); // drain observer
    flushRaf(); // the cancelled frame must be a no-op
    expect(before.classList.contains('aos-animate')).toBe(false);
    expect(after.classList.contains('aos-animate')).toBe(false);
  });
});
