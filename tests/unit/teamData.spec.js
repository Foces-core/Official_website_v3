import { describe, it, expect } from 'vitest';
import { cardData, cubeSlides } from '../../src/data/team.js';
import { validateTeam } from '../../src/utils/validateTeam.js';

// Guard for the live team roster (src/data/team.js). Runs in CI via
// `pnpm test:unit`, so a malformed entry — duplicate name, missing role, or
// a missing img/blur pairing — fails the build. Mirrors eventsData.spec.js.

describe('validateTeam — shape rules', () => {
  it('accepts a well-formed member', () => {
    const member = { name: 'A Member', img: '/a.webp', blur: '/a-blur.webp', role: 'Lead' };
    expect(validateTeam([member])).toEqual([]);
  });

  it('flags a missing role', () => {
    const member = { name: 'A Member', img: '/a.webp', blur: '/a-blur.webp' };
    expect(validateTeam([member]).join('\n')).toContain('missing role');
  });

  it('flags duplicate names', () => {
    const member = { name: 'A Member', img: '/a.webp', blur: '/a-blur.webp', role: 'Lead' };
    const problems = validateTeam([member, { ...member, role: 'Other' }]);
    expect(problems.join('\n')).toContain('duplicate name');
  });

  it('flags a missing img/blur pairing', () => {
    const member = { name: 'A Member', img: '/a.webp', role: 'Lead' };
    expect(validateTeam([member]).join('\n')).toContain('missing blur');
  });
});

describe('teamData integrity (src/data/team.js)', () => {
  it('is valid per validateTeam rules', () => {
    const problems = validateTeam(cardData);
    expect(problems, problems.join('\n')).toEqual([]);
  });

  it('has at least one member', () => {
    expect(cardData.length).toBeGreaterThan(0);
  });

  it('builds cubeSlides as exactly three copies for the seamless wrap', () => {
    expect(cubeSlides).toHaveLength(cardData.length * 3);
    expect(cubeSlides[0]).toBe(cardData[0]);
    expect(cubeSlides[cardData.length]).toBe(cardData[0]);
    expect(cubeSlides[cardData.length * 2]).toBe(cardData[0]);
  });
});
