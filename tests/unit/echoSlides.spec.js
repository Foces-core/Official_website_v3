import { describe, it, expect } from 'vitest';
import { echoSlides, carouselSlides } from '../../src/data/echoSlides.js';
import { validateEchoSlides } from '../../src/utils/validateEchoSlides.js';

// Guard for the live Featuring carousel slides (src/data/echoSlides.js).
// Runs in CI via `pnpm test:unit`, so a malformed slide — missing alt, image,
// or srcset — fails the build. Mirrors teamData.spec.js / eventsData.spec.js.

describe('validateEchoSlides — shape rules', () => {
  const slide = (overrides = {}) => ({
    image: '/episode.webp',
    imageSet: '/episode.webp 1280w, /episode-960.webp 960w',
    blur: '/episode-blur.webp',
    alt: 'ECHO - Episode 1',
    ...overrides,
  });

  it('accepts a well-formed slide', () => {
    expect(validateEchoSlides([slide()])).toEqual([]);
  });

  it('flags a missing alt', () => {
    const problems = validateEchoSlides([slide({ alt: '' })]);
    expect(problems.join('\n')).toContain('missing alt');
  });

  it('flags a missing image', () => {
    const problems = validateEchoSlides([slide({ image: '' })]);
    expect(problems.join('\n')).toContain('missing image');
  });

  it('flags a missing imageSet (srcset)', () => {
    const problems = validateEchoSlides([slide({ imageSet: '' })]);
    expect(problems.join('\n')).toContain('missing imageSet');
  });

  it('flags a missing blur placeholder', () => {
    const problems = validateEchoSlides([slide({ blur: '' })]);
    expect(problems.join('\n')).toContain('missing blur');
  });

  it('flags duplicate alts', () => {
    const a = slide();
    const problems = validateEchoSlides([a, { ...a, image: '/other.webp' }]);
    expect(problems.join('\n')).toContain('duplicate alt');
  });
});

describe('echoSlides integrity (src/data/echoSlides.js)', () => {
  it('is valid per validateEchoSlides rules', () => {
    const problems = validateEchoSlides(echoSlides);
    expect(problems, problems.join('\n')).toEqual([]);
  });

  it('has at least one slide', () => {
    expect(echoSlides.length).toBeGreaterThan(0);
  });

  it('builds carouselSlides as exactly three copies for the seamless wrap', () => {
    expect(carouselSlides).toHaveLength(echoSlides.length * 3);
    expect(carouselSlides[0]).toBe(echoSlides[0]);
    expect(carouselSlides[echoSlides.length]).toBe(echoSlides[0]);
    expect(carouselSlides[echoSlides.length * 2]).toBe(echoSlides[0]);
  });
});
