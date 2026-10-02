import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SITE_ORIGIN,
  seoRoutes,
  escapeHtml,
  headTagsForRoute,
  eventJsonLd,
  siteJsonLd,
} from '../../src/utils/seoMeta.js';

describe('seoMeta', () => {
  describe('seoRoutes', () => {
    it('covers exactly the three real routes', () => {
      expect(seoRoutes().map((r) => r.path)).toEqual(['/', '/events', '/contact']);
    });

    it('gives every route a unique, non-empty title and description', () => {
      const routes = seoRoutes();
      const titles = new Set(routes.map((r) => r.title));
      expect(titles.size).toBe(routes.length);
      for (const route of routes) {
        expect(route.title.length).toBeGreaterThan(0);
        expect(route.description.length).toBeGreaterThan(0);
        // Slightly-optimized title (first 60 chars) must remain meaningful —
        // the events title must not collapse into the home one.
        expect(route.title.startsWith('Events')).toBe(route.path === '/events');
      }
    });
  });

  describe('escapeHtml', () => {
    it('escapes attribute-breaking characters', () => {
      expect(escapeHtml('a&b"c<d>e\'f')).toBe('a&amp;b&quot;c&lt;d&gt;e&#39;f');
    });
  });

  describe('headTagsForRoute', () => {
    it('builds description + og/twitter tags and a canonical URL', () => {
      const route = seoRoutes().find((r) => r.path === '/events');
      const head = headTagsForRoute(route);

      expect(head.title).toBe(route.title);
      expect(head.canonical).toBe(`${SITE_ORIGIN}/events`);

      const selectors = head.metaTags.map((m) => m.selector);
      expect(selectors).toEqual([
        'meta[name="description"]',
        'meta[property="og:title"]',
        'meta[property="og:description"]',
        'meta[property="og:url"]',
        'meta[property="twitter:title"]',
        'meta[property="twitter:description"]',
        'meta[property="twitter:url"]',
      ]);

      const all = head.metaTags.map((m) => m.tag).join('\n');
      expect(all).toContain('name="description"');
      expect(all).toContain('og:title');
      expect(all).toContain('twitter:url');
      // Every interpolated value is escaped: no attribute value may hold a raw
      // quote or angle bracket (parse each content="..." value, don't regex
      // across tags).
      for (const { tag } of head.metaTags) {
        const content = /content="([^"]*)"/.exec(tag)[1];
        expect(content).not.toMatch(/[<>"']/);
      }
    });

    it('maps the home route to the bare origin canonical', () => {
      const home = seoRoutes().find((r) => r.path === '/');
      expect(headTagsForRoute(home).canonical).toBe(SITE_ORIGIN);
    });
  });

  describe('eventJsonLd', () => {
    const base = {
      name: 'Coding Arena 4.0',
      desc: 'The ultimate competitive programming battlefield.',
      startDate: '2026-07-27',
      endDate: '2026-08-05',
    };

    it('emits a JSON document with an @graph entry per event', () => {
      const json = eventJsonLd([base, { ...base, name: 'Other', startDate: '2026-07-01' }]);
      // Raw JSON, never an HTML string: callers assign it to a script's
      // textContent, so there is no tag to strip back off.
      expect(json.startsWith('{')).toBe(true);
      expect(json).not.toContain('<script');

      const parsed = JSON.parse(json);
      expect(parsed['@context']).toBe('https://schema.org');
      expect(parsed['@graph']).toHaveLength(2);
      expect(parsed['@graph'][0]['@type']).toBe('Event');
    });

    it('carries name, dates, place, and organizer for an event', () => {
      const parsed = JSON.parse(eventJsonLd([base]));
      const ev = parsed['@graph'][0];
      expect(ev.name).toBe('Coding Arena 4.0');
      expect(ev.startDate).toBe('2026-07-27');
      expect(ev.endDate).toBe('2026-08-05');
      expect(ev.eventStatus).toBe('https://schema.org/EventScheduled');
      expect(ev.location.name).toBe('College of Engineering Chengannur');
      expect(ev.location.address.addressLocality).toBe('Alappuzha District');
      expect(ev.organizer.name).toMatch(/FOCES/);
      expect(ev.organizer.url).toBe(SITE_ORIGIN);
    });

    it('adds url only when the event has a websiteUrl', () => {
      const withUrl = JSON.parse(eventJsonLd([{ ...base, websiteUrl: 'https://example.com/x' }]));
      expect(withUrl['@graph'][0].url).toBe('https://example.com/x');

      const withoutUrl = JSON.parse(eventJsonLd([base]));
      expect(Object.hasOwn(withoutUrl['@graph'][0], 'url')).toBe(false);
    });

    it('omits endDate when absent instead of emitting null', () => {
      const parsed = JSON.parse(eventJsonLd([{ ...base, endDate: undefined }]));
      expect(Object.hasOwn(parsed['@graph'][0], 'endDate')).toBe(false);
    });

    it('tolerates a null/empty event list with an empty @graph', () => {
      for (const input of [null, undefined, []]) {
        const parsed = JSON.parse(eventJsonLd(input));
        expect(parsed['@graph']).toEqual([]);
      }
    });
  });

  describe('siteJsonLd', () => {
    const strip = (json) => JSON.parse(json);

    it('emits an Organization + WebSite @graph', () => {
      const json = siteJsonLd();
      expect(json.startsWith('{')).toBe(true);
      expect(json).not.toContain('<script');

      const parsed = strip(json);
      expect(parsed['@context']).toBe('https://schema.org');
      const types = parsed['@graph'].map((n) => n['@type']).sort();
      expect(types).toEqual(['Organization', 'WebSite']);
    });

    it('carries identity, inbox, address, and socials on the Organization', () => {
      const org = strip(siteJsonLd())['@graph'].find((n) => n['@type'] === 'Organization');
      expect(org.name).toMatch(/FOCES/);
      expect(org.url).toBe(SITE_ORIGIN);
      expect(org.email).toBe('foces@ceconline.edu');
      expect(org.address.addressLocality).toBe('Alappuzha District');
      expect(org.sameAs).toEqual(
        expect.arrayContaining([
          expect.stringContaining('instagram.com'),
          expect.stringContaining('linkedin.com'),
        ]),
      );
      expect(org.sameAs).toHaveLength(4);
    });

    it('links the WebSite publisher to the Organization node', () => {
      const parsed = strip(siteJsonLd());
      const site = parsed['@graph'].find((n) => n['@type'] === 'WebSite');
      const org = parsed['@graph'].find((n) => n['@type'] === 'Organization');
      expect(site.url).toBe(SITE_ORIGIN);
      expect(site.publisher).toEqual({ '@id': org['@id'] });
    });

    it('stays in sync with the static copy in index.html (no-JS crawlers)', () => {
      const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
      const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
      const match = html.match(
        /<script type="application\/ld\+json" id="foces-site-jsonld">([\s\S]*?)<\/script>/,
      );
      expect(match).not.toBeNull();
      expect(JSON.parse(match[1])).toEqual(strip(siteJsonLd()));
    });
  });
});
