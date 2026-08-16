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

  it('omits blur entirely when not supplied', () => {
    const photo = photoTriplet('/assets/p.webp', '/assets/p-800.webp', '/assets/p-400.webp');
    expect(Object.hasOwn(photo, 'blur')).toBe(false);
  });

  it('preserves an explicitly supplied null blur for validation', () => {
    const photo = photoTriplet('/assets/p.webp', '/assets/p-800.webp', '/assets/p-400.webp', null);
    expect(photo.blur).toBe(null);
  });

  it('preserves an explicitly supplied empty blur for validation', () => {
    const photo = photoTriplet('/assets/p.webp', '/assets/p-800.webp', '/assets/p-400.webp', '');
    expect(photo.blur).toBe('');
  });
});
