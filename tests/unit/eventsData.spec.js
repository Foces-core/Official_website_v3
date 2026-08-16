import { describe, it, expect } from 'vitest';
import { featuredEvents } from '../../src/data/events.js';
import { validateEvents } from '../../src/utils/validateEvents.js';

// Guard for the live event data (src/data/events.js). Runs in CI via
// `pnpm test:unit`, so a malformed entry — duplicate id/name, missing
// required field, or a broken images/imageSets pairing — fails the build.
describe('featuredEvents data integrity', () => {
  it('is valid per validateEvents rules', () => {
    const problems = validateEvents(featuredEvents);
    expect(problems, problems.join('\n')).toEqual([]);
  });

  it('has at least one event', () => {
    expect(featuredEvents.length).toBeGreaterThan(0);
  });
});

describe('validateEvents — optional photo blur', () => {
  const photo = (overrides = {}) => ({
    url: '/poster.webp',
    srcset: '/poster.webp 1000w, /poster-800.webp 800w',
    ...overrides,
  });

  const event = (photos) => ({
    id: 1,
    name: 'Test Event',
    tag: 'Tag',
    date: '1st Jan 2026',
    desc: 'Description',
    photos,
  });

  it('accepts photos without a blur (plain lazy load)', () => {
    expect(validateEvents([event([photo()])])).toEqual([]);
  });

  it('accepts a photo with a blur LQIP', () => {
    expect(validateEvents([event([photo({ blur: '/poster-blur.webp' })])])).toEqual([]);
  });

  it('flags a photo whose blur is present but empty', () => {
    const problems = validateEvents([event([photo({ blur: '' })])]);
    expect(problems.join('\n')).toContain('photos must be a non-empty array of { url, srcset }');
  });
});
