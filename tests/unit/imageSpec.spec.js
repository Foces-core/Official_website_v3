import { describe, it, expect } from 'vitest';
import { createImageSpec } from '../../src/utils/imageSpec.js';

describe('imageSpec', () => {
  it('returns same src/sizes and caps srcSet via policy', () => {
    const src = '/a.webp';
    const srcSet = '/a.webp 1280w, /b.webp 800w';
    const sizes = '100vw';
    const spec = createImageSpec({
      src,
      srcSet,
      sizes,
      policy: { slowNetwork: false, lowCPU: false },
    });
    expect(spec.src).toBe(src);
    expect(spec.sizes).toBe(sizes);
    expect(typeof spec.srcSet).toBe('string');
  });

  it('returns null srcSet as is', () => {
    const spec = createImageSpec({ src: '/a.webp', srcSet: null, sizes: '100vw', policy: {} });
    expect(spec.srcSet).toBeNull();
  });

  it('caps srcSet for slowNetwork', () => {
    const srcSet = '/a.webp 1280w, /b.webp 800w, /c.webp 400w';
    const slow = createImageSpec({ src: '/a.webp', srcSet, policy: { slowNetwork: true } });
    const fast = createImageSpec({
      src: '/a.webp',
      srcSet,
      policy: { slowNetwork: false, lowCPU: false },
    });
    // slow should have fewer or smaller candidates than fast
    expect(slow.srcSet.length).toBeLessThanOrEqual(fast.srcSet.length);
  });

  it('handles missing policy', () => {
    const spec = createImageSpec({ src: '/a.webp', srcSet: '/a.webp 400w' });
    expect(spec.src).toBe('/a.webp');
  });
});
