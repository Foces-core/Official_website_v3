import { describe, it, expect, vi } from 'vitest';
import {
  pickActiveSection,
  pickOnViewport,
  resolveNavAction,
  resolveLogoAction,
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

describe('pickOnViewport — the DOM-reading wrapper', () => {
  const SECTION_IDS = ['home', 'about', 'featuring', 'events', 'execom'];

  // Fake document whose getBoundingClientRect().top is viewport-relative,
  // like the real browser (scrollY already subtracted) — exactly the shape
  // pickOnViewport forwards to pickActiveSection. jsdom's real rects are
  // all-zero, so the wrapper takes an injectable doc to stay meaningful.
  const makeDoc = (rectTops) => ({
    documentElement: { scrollHeight: 2000 },
    getElementById: (id) =>
      id in rectTops && rectTops[id] != null
        ? { getBoundingClientRect: () => ({ top: rectTops[id] }) }
        : null,
  });

  it('returns contact on the contact route without touching the DOM', () => {
    const getElementById = vi.fn();
    const result = pickOnViewport({
      sectionIds: SECTION_IDS,
      pathname: '/contact',
      win: { scrollY: 0, innerHeight: 800 },
      doc: { documentElement: { scrollHeight: 2000 }, getElementById },
    });
    expect(result).toBe('contact');
    expect(getElementById).not.toHaveBeenCalled();
  });

  it('returns null on other non-home routes (no home section is current)', () => {
    const result = pickOnViewport({
      sectionIds: SECTION_IDS,
      pathname: '/events',
      win: { scrollY: 0, innerHeight: 800 },
      doc: makeDoc({}),
    });
    expect(result).toBeNull();
  });

  it('picks the section under the 35% reference line from live geometry', () => {
    // viewportH 800 → refY 280; scrollY 1100 → viewport bottom 1900, not
    // near bottom (1950). Line scan: home −980 ✓, about −500 ✓, featuring
    // 200 ✓, events 900 ✗, execom 1500 ✗ → featuring.
    const result = pickOnViewport({
      sectionIds: SECTION_IDS,
      pathname: '/',
      win: { scrollY: 1100, innerHeight: 800 },
      doc: makeDoc({ home: -980, about: -500, featuring: 200, events: 900, execom: 1500 }),
    });
    expect(result).toBe('featuring');
  });

  it('applies the near-bottom fallback to the last mounted section', () => {
    // scrollY 1400 → viewport bottom 2200 ≥ 1950 → fallback overrides the
    // line scan (which stops at featuring) with execom, the last section
    // present, even though its top (1200) never crossed the line.
    const result = pickOnViewport({
      sectionIds: SECTION_IDS,
      pathname: '/',
      win: { scrollY: 1400, innerHeight: 800 },
      doc: makeDoc({ home: -1280, about: -800, featuring: -100, events: 600, execom: 1200 }),
    });
    expect(result).toBe('execom');
  });

  it('defaults to home when no section has mounted yet', () => {
    const result = pickOnViewport({
      sectionIds: SECTION_IDS,
      pathname: '/',
      win: { scrollY: 0, innerHeight: 800 },
      doc: makeDoc({ home: null, about: null, featuring: null, events: null, execom: null }),
    });
    expect(result).toBe('home');
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

  it('header HOME from a non-home route also lands home-with-anchor', () => {
    expect(resolveNavAction('home', '/events')).toEqual({
      type: 'navigate',
      to: '/',
      state: { id: 'home' },
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

describe('pickOnViewport - route awareness edges', () => {
  it('returns contact on the /contact route without reading the DOM', () => {
    const doc = { getElementById: vi.fn(), documentElement: {} };
    expect(
      pickOnViewport({
        sectionIds: ['home'],
        pathname: '/contact',
        win: { scrollY: 0, innerHeight: 800 },
        doc,
      }),
    ).toBe('contact');
  });

  it('returns null on unknown routes (e.g. /events)', () => {
    const doc = { getElementById: vi.fn(), documentElement: {} };
    expect(
      pickOnViewport({
        sectionIds: ['home'],
        pathname: '/events',
        win: { scrollY: 0, innerHeight: 800 },
        doc,
      }),
    ).toBeNull();
  });
});
