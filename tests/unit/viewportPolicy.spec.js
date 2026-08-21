import { describe, it, expect } from 'vitest';
import { getFeaturingLayout, getTeamLayout } from '../../src/utils/viewportPolicy.js';

describe('viewportPolicy', () => {
  describe('getFeaturingLayout', () => {
    it('returns 1 col under 500', () => {
      const { slidesPerView, spaceBetween, sizes } = getFeaturingLayout(400);
      expect(slidesPerView).toBe(1);
      expect(spaceBetween).toBe(50);
      expect(sizes).toBe('calc(100vw - 112px)');
    });
    it('returns 2 cols 500-750', () => {
      const { slidesPerView, sizes } = getFeaturingLayout(600);
      expect(slidesPerView).toBe(2);
      expect(sizes).toBe('calc((100vw - 112px - 50px) / 2)');
    });
    it('returns 3 cols at 750+', () => {
      const { slidesPerView, sizes } = getFeaturingLayout(800);
      expect(slidesPerView).toBe(3);
      expect(sizes).toBe('calc((100vw - 112px - 100px) / 3)');
    });
    it('boundary 500 and 750', () => {
      expect(getFeaturingLayout(500).slidesPerView).toBe(2);
      expect(getFeaturingLayout(750).slidesPerView).toBe(3);
      expect(getFeaturingLayout(749).slidesPerView).toBe(2);
    });
  });

  describe('getTeamLayout', () => {
    it('returns 1 col for cube/mobile', () => {
      expect(getTeamLayout(500, false, true).slidesPerView).toBe(1);
      expect(getTeamLayout(800, true, false).slidesPerView).toBe(1);
      expect(getTeamLayout(800, false, true).spaceBetween).toBe(0);
      expect(getTeamLayout(800, true, false).spaceBetween).toBe(20);
      expect(getTeamLayout(800, true, false).sizes).toBe('320px');
      expect(getTeamLayout(800, false, true).sizes).toBe('360px');
    });
    it('returns 4 cols at 1280+', () => {
      const { slidesPerView, spaceBetween, sizes } = getTeamLayout(1300, true, true);
      expect(slidesPerView).toBe(4);
      expect(spaceBetween).toBe(24);
      expect(sizes).toBe('calc((80vw - 168px) / 4)');
    });
    it('returns 3 cols at 1024', () => {
      const { slidesPerView, sizes } = getTeamLayout(1100, true, true);
      expect(slidesPerView).toBe(3);
      expect(sizes).toBe('calc((80vw - 144px) / 3)');
    });
    it('returns 2 cols 640-767 with 83.33vw', () => {
      const { slidesPerView, sizes } = getTeamLayout(700, true, true);
      expect(slidesPerView).toBe(2);
      expect(sizes).toBe('calc((83.33vw - 116px) / 2)');
    });
    it('returns 2 cols 768-1024 with 80vw', () => {
      const { sizes } = getTeamLayout(900, true, true);
      expect(sizes).toBe('calc((80vw - 116px) / 2)');
    });
    it('returns 1 col below 640 flat', () => {
      const { slidesPerView, sizes } = getTeamLayout(500, true, true);
      expect(slidesPerView).toBe(1);
      expect(sizes).toBe('360px');
    });
  });
});
