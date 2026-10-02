import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { featuredEvents } from '../../src/data/events.js';
import { CONTACT_EMAIL } from '../../src/utils/contactSubmitLogic.js';

// AI-crawlability guards (ADR-0020): the hand-maintained llms.txt must track
// the data modules it summarizes, and robots.txt must never block AI
// fetchers. Either file drifting silently degrades what assistants know
// about the club, so the specs fail loudly instead.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const llms = fs.readFileSync(path.join(root, 'public/llms.txt'), 'utf8');
const robots = fs.readFileSync(path.join(root, 'public/robots.txt'), 'utf8');

describe('llms.txt', () => {
  it('follows the llmstxt.org shape (H1 title + summary blockquote)', () => {
    expect(llms.startsWith('# ')).toBe(true);
    expect(llms).toContain('\n> ');
  });

  it('names every event from the single source of truth', () => {
    expect(featuredEvents.length).toBeGreaterThan(0);
    for (const event of featuredEvents) {
      expect(llms).toContain(event.name);
    }
  });

  it('links every canonical route crawlers should fetch', () => {
    for (const url of [
      'https://foces.ceconline.edu/',
      'https://foces.ceconline.edu/events',
      'https://foces.ceconline.edu/contact',
    ]) {
      expect(llms).toContain(url);
    }
  });

  it('carries the contact inbox', () => {
    expect(llms).toContain(CONTACT_EMAIL);
  });
});

describe('robots.txt', () => {
  it('leaves the whole site open and advertises the sitemap', () => {
    expect(robots).toMatch(/User-agent: \*\s*\nAllow: \//);
    expect(robots).not.toMatch(/^Disallow: \/$/m);
    expect(robots).toContain('Sitemap: https://foces.ceconline.edu/sitemap.xml');
  });

  it('explicitly welcomes the major AI fetchers', () => {
    for (const bot of [
      'GPTBot',
      'ClaudeBot',
      'PerplexityBot',
      'Google-Extended',
      'CCBot',
      'Bytespider',
    ]) {
      expect(robots).toContain(`User-agent: ${bot}`);
    }
  });
});
