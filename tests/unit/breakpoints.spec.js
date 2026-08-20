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
  teamSlidesPerView,
  teamGap,
  TEAM_CARD_SIZES,
} from '../../src/utils/breakpoints.js';

describe('breakpoint constants agree with detectProfile CSS queries', () => {
  it('mobile boundary is 767px', () => {
    expect(MOBILE_MAX).toBe(767);
  });
  it('layout-desktop bucket is 768px', () => {
    expect(DESKTOP_MIN).toBe(768);
  });
  it('detectProfile-desktop is 1024px', () => {
    expect(isWideScreen(1023)).toBe(false);
    expect(isWideScreen(1024)).toBe(true);
  });
});

describe('isSmallScreen', () => {
  it('true below 500, false from 500 up', () => {
    expect(isSmallScreen(499)).toBe(true);
    expect(isSmallScreen(SMALL_SCREEN_MAX)).toBe(false);
    expect(isSmallScreen(640)).toBe(false);
  });
});

describe('isMobileViewport / isDesktopViewport', () => {
  it('partition at 768', () => {
    expect(isMobileViewport(767)).toBe(true);
    expect(isMobileViewport(768)).toBe(false);
    expect(isDesktopViewport(767)).toBe(false);
    expect(isDesktopViewport(768)).toBe(true);
  });
});

describe('featuringSlidesPerView', () => {
  it('1 below 500, 2 from 500-749, 3 from 750', () => {
    expect(featuringSlidesPerView(400)).toBe(1);
    expect(featuringSlidesPerView(500)).toBe(2);
    expect(featuringSlidesPerView(749)).toBe(2);
    expect(featuringSlidesPerView(750)).toBe(3);
    expect(featuringSlidesPerView(1280)).toBe(3);
  });
});

describe('teamSlidesPerView', () => {
  it('1 below 640, 2 at 640, 3 at 1024, 4 at 1280', () => {
    expect(teamSlidesPerView(400)).toBe(1);
    expect(teamSlidesPerView(639)).toBe(1);
    expect(teamSlidesPerView(640)).toBe(2);
    expect(teamSlidesPerView(1023)).toBe(2);
    expect(teamSlidesPerView(1024)).toBe(3);
    expect(teamSlidesPerView(1279)).toBe(3);
    expect(teamSlidesPerView(1280)).toBe(4);
  });
});

describe('teamGap', () => {
  it('24px at 1024+, 20px below', () => {
    expect(teamGap(1023)).toBe(20);
    expect(teamGap(1024)).toBe(24);
    expect(teamGap(1280)).toBe(24);
  });
});

describe('TEAM_CARD_SIZES', () => {
  it('contains 1280px, 640px, and 320px', () => {
    expect(TEAM_CARD_SIZES).toContain('1280px');
    expect(TEAM_CARD_SIZES).toContain('640px');
    expect(TEAM_CARD_SIZES).toContain('320px');
  });
});
