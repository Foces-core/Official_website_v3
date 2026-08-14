import { describe, it, expect } from 'vitest';
import {
  SMALL_SCREEN_MAX,
  MOBILE_MAX,
  DESKTOP_MIN,
  isSmallScreen,
  isMobileViewport,
  isDesktopViewport,
  isWideScreen,
  featuringSlidesPerView,
} from '../../src/utils/breakpoints.js';

// Viewport breakpoint hygiene: the numbers 500/767/768/1024 used to be
// scattered as magic literals across Loader, Navbar, ScrollGate, HeroSection
// and Featuring. This module is the single source of truth. Two DISTINCT
// thresholds are at play, and the tests pin both:
//   - 767/768 — the app's own layout bucket (mobile menu, ScrollGate cache)
//   - 1024    — detectProfile's desktop query (min-width: 1024px), used by
//     the Vanta hero. NOT the same boundary as DESKTOP_MIN.
// The 767 mobile edge matches detectProfile's `(max-width: 767px)`.

describe('breakpoint constants agree with detectProfile CSS queries', () => {
  it('mobile boundary is 767px (max-width: 767px)', () => {
    expect(MOBILE_MAX).toBe(767);
  });

  it('layout-desktop bucket is 768px (app-internal, not detectProfile)', () => {
    expect(DESKTOP_MIN).toBe(768);
  });

  it('detectProfile-desktop is 1024px, distinct from the 768px layout bucket', () => {
    expect(isWideScreen(1023)).toBe(false);
    expect(isWideScreen(1024)).toBe(true);
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
  it('1 slide below 500px, 2 from 500px through 749px, 3 from 750px', () => {
    expect(featuringSlidesPerView(400)).toBe(1);
    expect(featuringSlidesPerView(500)).toBe(2);
    expect(featuringSlidesPerView(749)).toBe(2);
    expect(featuringSlidesPerView(750)).toBe(3);
    expect(featuringSlidesPerView(1280)).toBe(3);
  });
});
