import { describe, it, expect } from 'vitest';
import {
  SMALL_SCREEN_MAX,
  MOBILE_MAX,
  DESKTOP_MIN,
  isSmallScreen,
  isMobileViewport,
  isDesktopViewport,
  featuringSlidesPerView,
} from '../../src/utils/breakpoints.js';

// Viewport breakpoint hygiene: the numbers 500/767/768/1024 used to be
// scattered as magic literals across Loader, Navbar, ScrollGate, HeroSection
// and Featuring. This module is the single source of truth — and its
// boundaries must stay in lockstep with the CSS media queries in
// detectProfile.js (mobile: max-width 767px, desktop: min-width 1024px).

describe('breakpoint constants agree with detectProfile CSS queries', () => {
  it('mobile boundary is 767px (max-width: 767px)', () => {
    expect(MOBILE_MAX).toBe(767);
  });

  it('desktop boundary is 768px (min-width: 768px)', () => {
    expect(DESKTOP_MIN).toBe(768);
  });
});

describe('isSmallScreen — the Loader/Featuring 500px narrow heuristic', () => {
  it('is true below 500 and false from 500 up', () => {
    expect(isSmallScreen(499)).toBe(true);
    expect(isSmallScreen(SMALL_SCREEN_MAX)).toBe(false);
    expect(isSmallScreen(640)).toBe(false);
  });
});

describe('isMobileViewport / isDesktopViewport — Navbar + ScrollGate buckets', () => {
  it('partition at 768 with no gap (767 mobile, 768 desktop)', () => {
    expect(isMobileViewport(767)).toBe(true);
    expect(isMobileViewport(768)).toBe(false);
    expect(isDesktopViewport(767)).toBe(false);
    expect(isDesktopViewport(768)).toBe(true);
    expect(isDesktopViewport(1024)).toBe(true);
  });
});

describe('featuringSlidesPerView — the ECHO carousel column policy', () => {
  it('1 slide under 500px, 2 up to 750px, 3 beyond', () => {
    expect(featuringSlidesPerView(400)).toBe(1);
    expect(featuringSlidesPerView(500)).toBe(2);
    expect(featuringSlidesPerView(749)).toBe(2);
    expect(featuringSlidesPerView(750)).toBe(3);
    expect(featuringSlidesPerView(1280)).toBe(3);
  });
});
