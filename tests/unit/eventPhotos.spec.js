import { describe, it, expect } from 'vitest';
import { photoTriplet } from '../../src/utils/eventPhotos.js';

describe('photoTriplet', () => {
  it('pairs the full URL with the standard 1000w/800w/400w srcset', () => {
    const photo = photoTriplet('/assets/p.webp', '/assets/p-800.webp', '/assets/p-400.webp');
    expect(photo).toEqual({
      url: '/assets/p.webp',
      srcset: '/assets/p.webp 1000w, /assets/p-800.webp 800w, /assets/p-400.webp 400w',
    });
  });
});
