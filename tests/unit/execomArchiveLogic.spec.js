import { describe, it, expect } from 'vitest';
import { batchVisible, memberMatches, searchMembers } from '../../src/utils/execomArchiveLogic.js';

const batches = [
  {
    year: '2024-25',
    era: 'ai',
    title: 'Execom 2024–2025',
    members: [
      { name: 'Ana Dev', role: 'Chairperson', category: 'chair', company: 'Acme' },
      { name: 'Bob Tech', role: 'Dev Lead', category: 'tech', company: 'Beta' },
    ],
  },
  {
    year: '2017-18',
    era: 'foss',
    title: 'Execom 2017–2018',
    members: [{ name: 'Cleo Foss', role: 'Secretary', category: 'chair', company: 'Gamma' }],
  },
];

describe('batchVisible', () => {
  it('shows every batch under all and only matching eras otherwise', () => {
    expect(batchVisible(batches[0], 'all')).toBe(true);
    expect(batchVisible(batches[0], 'ai')).toBe(true);
    expect(batchVisible(batches[0], 'foss')).toBe(false);
  });
});

describe('memberMatches', () => {
  const member = { name: 'Ana Dev', role: 'Chairperson', category: 'chair', company: 'Acme' };

  it('matches role and multi-term search fields', () => {
    expect(memberMatches(member, '', 'chair')).toBe(true);
    expect(memberMatches(member, '', 'tech')).toBe(false);
    expect(memberMatches(member, 'ana acme', 'all')).toBe(true);
    expect(memberMatches(member, 'chairperson', 'all')).toBe(true);
    expect(memberMatches(member, 'missing', 'all')).toBe(false);
  });
});

describe('searchMembers', () => {
  it('filters across batches and stamps the batch title', () => {
    const all = searchMembers(batches, '', 'all', 'all');
    expect(all).toHaveLength(3);
    expect(all[0].batchTitle).toBe('Execom 2024–2025');

    expect(searchMembers(batches, 'cleo', 'all', 'all')).toHaveLength(1);
    expect(searchMembers(batches, '', 'foss', 'all')).toHaveLength(1);
    expect(searchMembers(batches, '', 'all', 'design')).toHaveLength(0);
  });
});
