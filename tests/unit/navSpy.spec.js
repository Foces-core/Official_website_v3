import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  pickActiveSection,
  resolveNavAction,
  resolveLogoAction,
  coalesceToFrame,
} from '../../src/Pages/LandingPage/Navbar/navSpy.js';

describe('pickActiveSection — the navbar scrollspy decision', () => {
  // Worked example: 5 sections (home, about, featuring, events, execom) with
  // DOCUMENT-absolute tops; getTop is viewport-relative (like
  // getBoundingClientRect().top in the real caller), so the fixture subtracts
  // scrollY. refY = 0.35 × viewportH is computed inside the module (the
  // policy lives there, not in the caller).
  const SECTION_IDS = ['home', 'about', 'featuring', 'events', 'execom'];
  const VIEWPORT_H = 800; // refY = 280
  const DOC_HEIGHT = 2000; // near-bottom threshold: docHeight − 50 = 1950
  const POSITIONS = { home: 120, about: 600, featuring: 1300, events: 2000, execom: 2600 };
  const tops =
    (scrollY, overrides = {}) =>
    (id) =>
      id in overrides ? overrides[id] : POSITIONS[id] - scrollY;

  it('picks the section whose top crossed the reference line (last one wins)', () => {
    const result = pickActiveSection({
      sectionIds: SECTION_IDS,
      scrollY: 0,
      viewportH: VIEWPORT_H,
      docHeight: DOC_HEIGHT,
      getTop: tops(0),
    });
    // home (120) is the only top ≤ refY (280) → stays on home
    expect(result).toBe('home');
  });

  it('moves to a lower section as the page scrolls down', () => {
    // scrollY 1100: home −980 ✓, about −500 ✓, featuring 200 ≤ 280 ✓,
    // events 900 ✗, execom 1500 ✗ → featuring. Not near bottom yet
    // (800 + 1100 = 1900 < 1950), so no fallback overrides it.
    const result = pickActiveSection({
      sectionIds: SECTION_IDS,
      scrollY: 1100,
      viewportH: VIEWPORT_H,
      docHeight: DOC_HEIGHT,
      getTop: tops(1100),
    });
    expect(result).toBe('featuring');
  });

  it('picks the last section near the bottom even when it has not crossed the line', () => {
    // scrollY 1400 → viewport bottom 2200 ≥ 1950 → near bottom. The line scan
    // reaches featuring (−100), then the fallback overrides with the last
    // section present in the DOM: execom (top 1200, still below the line).
    const result = pickActiveSection({
      sectionIds: SECTION_IDS,
      scrollY: 1400,
      viewportH: VIEWPORT_H,
      docHeight: DOC_HEIGHT,
      getTop: tops(1400),
    });
    expect(result).toBe('execom');
  });

  it('skips unmounted (lazy) sections in both the line scan and the bottom fallback', () => {
    // events + execom not yet mounted (null tops) → fallback lands on
    // featuring, the last section actually present in the DOM.
    const scrolled = pickActiveSection({
      sectionIds: SECTION_IDS,
      scrollY: 1400,
      viewportH: VIEWPORT_H,
      docHeight: DOC_HEIGHT,
      getTop: tops(1400, { events: null, execom: null }),
    });
    expect(scrolled).toBe('featuring');

    const top = pickActiveSection({
      sectionIds: SECTION_IDS,
      scrollY: 0,
      viewportH: VIEWPORT_H,
      docHeight: DOC_HEIGHT,
      getTop: tops(0, { events: null, execom: null }),
    });
    expect(top).toBe('home');
  });

  it('counts a section whose top sits exactly on the reference line', () => {
    // refY = 280; about forced to exactly 280 → selected
    const result = pickActiveSection({
      sectionIds: SECTION_IDS,
      scrollY: 0,
      viewportH: VIEWPORT_H,
      docHeight: DOC_HEIGHT,
      getTop: tops(0, { home: null, about: 280 }),
    });
    expect(result).toBe('about');
  });

  it('counts a section at the very top of the viewport (top = 0)', () => {
    const result = pickActiveSection({
      sectionIds: SECTION_IDS,
      scrollY: 0,
      viewportH: VIEWPORT_H,
      docHeight: DOC_HEIGHT,
      getTop: tops(0, { home: 0 }),
    });
    expect(result).toBe('home');
  });

  it('falls back to home when no section has mounted yet', () => {
    const result = pickActiveSection({
      sectionIds: SECTION_IDS,
      scrollY: 0,
      viewportH: VIEWPORT_H,
      docHeight: DOC_HEIGHT,
      getTop: () => null,
    });
    expect(result).toBe('home');
  });

  it('is not near-bottom until the margin is actually crossed', () => {
    // scrollY 1100 → bottom 1900 < 1950 → normal line scan (featuring wins)
    const result = pickActiveSection({
      sectionIds: SECTION_IDS,
      scrollY: 1100,
      viewportH: VIEWPORT_H,
      docHeight: DOC_HEIGHT,
      getTop: tops(1100),
    });
    expect(result).toBe('featuring');
  });
});

describe('resolveNavAction — where a nav-item click goes', () => {
  it('routes to /contact regardless of current pathname', () => {
    expect(resolveNavAction('contact', '/')).toEqual({ type: 'route', to: '/contact' });
    expect(resolveNavAction('contact', '/events')).toEqual({ type: 'route', to: '/contact' });
  });

  it('navigates home with a state.id anchor from a non-home route', () => {
    expect(resolveNavAction('featuring', '/events')).toEqual({
      type: 'navigate',
      to: '/',
      state: { id: 'featuring' },
    });
  });

  it('scrolls to the section when already on the home page', () => {
    expect(resolveNavAction('about', '/')).toEqual({ type: 'scroll' });
  });
});

describe('resolveLogoAction — where the logo click goes', () => {
  it('navigates home from a non-home route', () => {
    expect(resolveLogoAction('/events')).toEqual({ type: 'navigate', to: '/' });
  });

  it('scrolls to the top when already home', () => {
    expect(resolveLogoAction('/')).toEqual({ type: 'scroll-top' });
  });
});

describe('coalesceToFrame — one run per animation frame', () => {
  let rafCallbacks;
  let rafId;

  beforeEach(() => {
    rafId = 0;
    rafCallbacks = new Map();
    vi.stubGlobal('requestAnimationFrame', (cb) => {
      rafCallbacks.set(++rafId, cb);
      return rafId;
    });
    vi.stubGlobal('cancelAnimationFrame', (id) => {
      rafCallbacks.delete(id);
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const fireFrame = () => {
    const cbs = [...rafCallbacks.values()];
    rafCallbacks.clear();
    cbs.forEach((cb) => cb());
  };

  it('coalesces any number of calls within a frame into a single run', () => {
    const run = vi.fn();
    const schedule = coalesceToFrame(run);
    schedule();
    schedule();
    schedule();
    expect(run).not.toHaveBeenCalled();
    fireFrame();
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('schedules again after a frame has fired', () => {
    const run = vi.fn();
    const schedule = coalesceToFrame(run);
    schedule();
    fireFrame();
    schedule();
    fireFrame();
    expect(run).toHaveBeenCalledTimes(2);
  });

  it('cancel() drops a pending run', () => {
    const run = vi.fn();
    const schedule = coalesceToFrame(run);
    schedule();
    schedule.cancel();
    fireFrame();
    expect(run).not.toHaveBeenCalled();
  });

  it('is idempotent when cancelled twice or scheduled after cancel', () => {
    const run = vi.fn();
    const schedule = coalesceToFrame(run);
    schedule();
    schedule.cancel();
    schedule.cancel(); // no-op
    schedule();
    fireFrame();
    expect(run).toHaveBeenCalledTimes(1);
  });
});
