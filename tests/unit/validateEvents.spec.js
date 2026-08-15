import { describe, it, expect } from 'vitest';
import { validateEvents } from '../../src/utils/validateEvents.js';

// Mirrors the shape of an entry in src/data/events.js (websiteUrl is optional).
const baseEvent = {
  id: 1,
  name: 'The Prompt Paradox 2.0',
  tag: 'AI & Prompt Engineering',
  date: '21st June 2026',
  photos: [
    { url: '/assets/a.webp', srcset: '/assets/a.webp 1000w' },
    { url: '/assets/b.webp', srcset: '/assets/b.webp 1000w' },
  ],
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

  it('flags a missing name', () => {
    const noName = { ...baseEvent };
    delete noName.name;
    expect(validateEvents([noName])).toEqual([expect.stringContaining('missing name')]);
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

  it('flags an empty photos array', () => {
    expect(validateEvents([{ ...baseEvent, photos: [] }])).toEqual([
      expect.stringContaining('photos'),
    ]);
  });

  it('flags a malformed photo entry (missing srcset)', () => {
    expect(validateEvents([{ ...baseEvent, photos: [{ url: '/assets/a.webp' }] }])).toEqual([
      expect.stringContaining('photos'),
    ]);
  });

  it('flags a non-object entry inside photos', () => {
    expect(validateEvents([{ ...baseEvent, photos: ['/assets/a.webp'] }])).toEqual([
      expect.stringContaining('photos'),
    ]);
  });

  it('flags a photo declaring the same URL at two different widths', () => {
    // Regression: java_algorithm_lecture.webp (576px) was reused as both the
    // 800w and 1000w candidates — browsers would upscale the 576px file.
    expect(
      validateEvents([
        {
          ...baseEvent,
          photos: [
            {
              url: '/assets/lecture.webp',
              srcset:
                '/assets/lecture.webp 1000w, /assets/lecture.webp 800w, /assets/lecture-400.webp 400w',
            },
          ],
        },
      ]),
    ).toEqual([expect.stringContaining('at both 1000w and 800w')]);
  });

  it('accepts a photo whose srcset has one width per URL', () => {
    expect(
      validateEvents([
        {
          ...baseEvent,
          photos: [
            {
              url: '/assets/lecture.webp',
              srcset: '/assets/lecture.webp 576w, /assets/lecture-400.webp 400w',
            },
          ],
        },
      ]),
    ).toEqual([]);
  });

  it('skips srcset parts that do not parse as width candidates', () => {
    // '/assets/crop.png' has no "<url> <width>w" descriptor — the parser
    // must ignore it rather than treat it as a malformed candidate.
    expect(
      validateEvents([
        {
          ...baseEvent,
          photos: [{ url: '/assets/a.webp', srcset: '/assets/a.webp 1000w, /assets/crop.png' }],
        },
      ]),
    ).toEqual([]);
  });
});
