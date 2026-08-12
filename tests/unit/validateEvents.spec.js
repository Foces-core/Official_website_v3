import { describe, it, expect } from 'vitest';
import { validateEvents } from '../../src/utils/validateEvents.js';

// Mirrors the shape of an entry in src/data/events.js (websiteUrl is optional).
const baseEvent = {
  id: 1,
  name: 'The Prompt Paradox 2.0',
  tag: 'AI & Prompt Engineering',
  date: '21st June 2026',
  image: '/assets/poster.webp',
  imageSet: '/assets/poster.webp 1000w',
  images: ['/assets/a.webp', '/assets/b.webp'],
  imageSets: ['/assets/a.webp 1000w', '/assets/b.webp 1000w'],
  desc: 'Test your prompt engineering mastery.',
};

describe('validateEvents', () => {
  it('returns no problems for a well-formed event list', () => {
    expect(validateEvents([baseEvent])).toEqual([]);
  });

  it('accepts an event with the optional websiteUrl present', () => {
    expect(validateEvents([{ ...baseEvent, websiteUrl: 'https://example.com' }])).toEqual([]);
  });

  it('flags duplicate ids', () => {
    expect(validateEvents([baseEvent, { ...baseEvent, id: 1, name: 'Another Event' }])).toEqual([
      expect.stringContaining('duplicate id 1'),
    ]);
  });

  it('flags duplicate names', () => {
    expect(validateEvents([baseEvent, { ...baseEvent, id: 2 }])).toEqual([
      expect.stringContaining('duplicate name'),
    ]);
  });

  it('flags a missing id', () => {
    const noId = { ...baseEvent };
    delete noId.id;
    expect(validateEvents([noId])).toEqual([expect.stringContaining('missing id')]);
  });

  it('flags a non-number id', () => {
    expect(validateEvents([{ ...baseEvent, id: '1' }])).toEqual([
      expect.stringContaining('id must be a number'),
    ]);
  });

  it('flags a websiteUrl that is present but blank', () => {
    expect(validateEvents([{ ...baseEvent, websiteUrl: '   ' }])).toEqual([
      expect.stringContaining('websiteUrl'),
    ]);
  });

  it('flags a missing required field (date)', () => {
    expect(validateEvents([{ ...baseEvent, date: '' }])).toEqual([
      expect.stringContaining('missing date'),
    ]);
  });

  it('flags an empty images array', () => {
    expect(validateEvents([{ ...baseEvent, images: [] }])).toEqual([
      expect.stringContaining('images'),
    ]);
  });

  it('flags images/imageSets length mismatch', () => {
    expect(validateEvents([{ ...baseEvent, imageSets: ['/assets/a.webp 1000w'] }])).toEqual([
      expect.stringContaining('imageSets'),
    ]);
  });

  it('flags a non-string entry inside images', () => {
    expect(validateEvents([{ ...baseEvent, images: ['/assets/a.webp', 42] }])).toEqual([
      expect.stringContaining('images'),
    ]);
  });
});
