import { describe, expect, it } from 'vitest';
import { shouldUseVisibilityGatedAutoplay } from '../../src/hooks/carouselAutoplayPolicy.js';

describe('shouldUseVisibilityGatedAutoplay', () => {
  it('enables autoplay only when it is configured and visibility can be observed', () => {
    expect(
      shouldUseVisibilityGatedAutoplay({ autoplayDelay: 3000, canObserveVisibility: true }),
    ).toBe(true);
    expect(
      shouldUseVisibilityGatedAutoplay({ autoplayDelay: 3000, canObserveVisibility: false }),
    ).toBe(false);
    expect(shouldUseVisibilityGatedAutoplay({ autoplayDelay: 0, canObserveVisibility: true })).toBe(
      false,
    );
  });
});
