/* global process */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cardData, cubeSlides } from '../../src/data/team.js';
import { validateTeam } from '../../src/utils/validateTeam.js';

// Guard for the live team roster (src/data/team.js). Runs in CI via
// `pnpm test:unit`, so a malformed entry — duplicate name, missing role, or
// a missing img — fails the build. Mirrors eventsData.spec.js.

describe('validateTeam — shape rules', () => {
  it('accepts a well-formed member', () => {
    const member = { name: 'A Member', img: '/a.webp', role: 'Lead' };
    expect(validateTeam([member])).toEqual([]);
  });

  it('flags a missing role', () => {
    const member = { name: 'A Member', img: '/a.webp' };
    expect(validateTeam([member]).join('\n')).toContain('missing role');
  });

  it('flags a missing name', () => {
    const member = { img: '/a.webp', role: 'Lead' };
    expect(validateTeam([member]).join('\n')).toContain('missing name');
  });

  it('flags a missing img', () => {
    const member = { name: 'A Member', role: 'Lead' };
    expect(validateTeam([member]).join('\n')).toContain('missing img');
  });

  it('flags duplicate names', () => {
    const member = { name: 'A Member', img: '/a.webp', role: 'Lead' };
    const problems = validateTeam([member, { ...member, role: 'Other' }]);
    expect(problems.join('\n')).toContain('duplicate name');
  });

  it('accepts an optional blur LQIP on lead images', () => {
    const member = { name: 'A Member', img: '/a.webp', blur: '/a-blur.webp', role: 'Lead' };
    expect(validateTeam([member])).toEqual([]);
  });

  it('flags a blur that is present but empty', () => {
    const member = { name: 'A Member', img: '/a.webp', blur: '', role: 'Lead' };
    expect(validateTeam([member]).join('\n')).toContain('blur must be a non-empty string');
  });

  it('rejects an explicit blur: null (supplied but invalid)', () => {
    const member = { name: 'A Member', img: '/a.webp', blur: null, role: 'Lead' };
    expect(validateTeam([member]).join('\n')).toContain('blur must be a non-empty string');
  });

  it('ignores a blur inherited through the prototype (not an own property)', () => {
    // Regression: `'blur' in member` would validate an inherited blur and
    // reject an invalid one that the member never supplied. Only own
    // properties count.
    const member = Object.create({ blur: '' });
    member.name = 'A Member';
    member.img = '/a.webp';
    member.role = 'Lead';
    expect(validateTeam([member])).toEqual([]);
  });

  it('accepts an optional srcset alongside blur', () => {
    const member = {
      name: 'A Member',
      img: '/a.webp',
      srcset: '/a.webp 800w, /a-400.webp 400w',
      blur: '/a-blur.webp',
      role: 'Lead',
    };
    expect(validateTeam([member])).toEqual([]);
  });

  it('flags a srcset that is present but empty', () => {
    const member = { name: 'A Member', img: '/a.webp', srcset: '', role: 'Lead' };
    expect(validateTeam([member]).join('\n')).toContain('srcset must be a non-empty string');
  });

  it('rejects an explicit srcset: null (supplied but invalid)', () => {
    const member = { name: 'A Member', img: '/a.webp', srcset: null, role: 'Lead' };
    expect(validateTeam([member]).join('\n')).toContain('srcset must be a non-empty string');
  });
});

describe('teamData integrity (src/data/team.js)', () => {
  it('is valid per validateTeam rules', () => {
    const problems = validateTeam(cardData);
    expect(problems, problems.join('\n')).toEqual([]);
  });

  it('gives every member a 400w srcset candidate and a w=20 blur LQIP', () => {
    // The whole point of the team payload work: each card must offer the
    // right-sized 400w candidate (so 1x phones/desktops don't download the
    // full-size file) and a blur placeholder for the blur-up treatment.
    cardData.forEach((member) => {
      expect(member.srcset, `${member.name}: missing 400w srcset candidate`).toContain('400w');
    });
    // The ?blur&w=20 query is consumed by the imagetools plugin at build
    // time, so the runtime blur value can't assert the width — scan the
    // source instead (same pattern as the AOS/font-subset guards). Exactly
    // one w=20 blur import per card; the advisor keeps w=128.
    const teamSource = readFileSync(join(process.cwd(), 'src', 'data', 'team.js'), 'utf8');
    const w20Blurs = teamSource.match(/\?blur&w=20/g) ?? [];
    expect(w20Blurs).toHaveLength(cardData.length);
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
