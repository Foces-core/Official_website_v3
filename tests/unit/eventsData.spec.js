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
