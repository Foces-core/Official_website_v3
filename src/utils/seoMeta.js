/**
 * Per-route SEO metadata + structured-data builders — pure, no DOM.
 *
 * Everything a head tag needs for `/`, `/events`, `/contact`, `/teams` is decided here;
 * Seo.jsx only applies it. The prerender snapshotter reuses the same
 * functions so a route's static HTML can never drift from its runtime head.
 *
 * The canonical origin mirrors index.html + sitemap.xml (ADR-0017).
 */
export const SITE_ORIGIN = 'https://foces.ceconline.edu';

const BASE_DESCRIPTION =
  'Official website of FOCES (Forum of Computer Engineering Students) at ' +
  'College of Engineering Chengannur — events, workshops, and our team.';

/**
 * Per-route metadata. `title` is the full document title; `description` is
 * the meta/OG description; `path` is the canonical path (no trailing slash).
 *
 * @returns {Array<{path: string, title: string, description: string}>}
 */
export function seoRoutes() {
  return [
    {
      path: '/',
      title: 'FOCES - Forum of Computer Engineering Students | CEC',
      description: BASE_DESCRIPTION,
    },
    {
      path: '/events',
      title: 'Events | FOCES - Forum of Computer Engineering Students',
      description:
        'Workshops, bootcamps, and competitions run by FOCES at College of ' +
        'Engineering Chengannur — from prompt-engineering contests to the ' +
        'Coding Arena bootcamp.',
    },
    {
      path: '/contact',
      title: 'Contact | FOCES - Forum of Computer Engineering Students',
      description:
        'Reach FOCES (Forum of Computer Engineering Students), College of ' +
        'Engineering Chengannur — contact form, email, socials, and location.',
    },
    {
      path: '/teams',
      title: 'Execom Archive | FOCES',
      description:
        'Past FOCES executive committees at College of Engineering ' +
        'Chengannur — one group photo per committee year in the Execom archive.',
    },
  ];
}

const HTML_ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escape text for safe interpolation into an HTML attribute or text node. */
export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => HTML_ENTITIES[c]);
}

/**
 * Serialize a route's metadata to the exact head-tag strings Seo.jsx applies
 * at runtime and the prerender snapshotter bakes into the static HTML. Each
 * entry carries the DOM selector that locates its existing tag in index.html,
 * so runtime patches and prerender patches hit the same element.
 *
 * @param {{path: string, title: string, description: string}} route
 * @returns {{title: string, metaTags: Array<{selector: string, tag: string}>, canonical: string}}
 */
export function headTagsForRoute(route) {
  const url = `${SITE_ORIGIN}${route.path === '/' ? '' : route.path}`;
  const meta = (attr, key, value) => ({
    selector: `meta[${attr}="${key}"]`,
    tag: `<meta ${attr}="${key}" content="${escapeHtml(value)}" />`,
  });
  return {
    title: route.title,
    metaTags: [
      meta('name', 'description', route.description),
      meta('name', 'title', route.title),
      meta('property', 'og:title', route.title),
      meta('property', 'og:description', route.description),
      meta('property', 'og:url', url),
      meta('property', 'twitter:title', route.title),
      meta('property', 'twitter:description', route.description),
      meta('property', 'twitter:url', url),
    ],
    canonical: url,
  };
}

/**
 * Site-wide structured data (schema.org Organization + WebSite) — the
 * machine-readable identity AI crawlers and search engines share. Rendered
 * statically in index.html (no-JS crawlers) and kept in sync at runtime by
 * Seo.jsx on every route, so the prerendered snapshots carry it too.
 *
 * sameAs mirrors the social links in the footer/contact page — update all
 * three together if a handle changes.
 *
 * @param {string} [origin] - canonical origin (overridable for tests)
 * @returns {string} the JSON document (callers assign it to a script's
 *   textContent — never an HTML string, so no tag-stripping regex is needed)
 */
// [name, jobTitle, sameAs[]] — titles mirror src/data/team.js.
const EXECOM_MEMBERS = [
  [
    'Aleetta Mariya Sebastian',
    'Chairperson',
    ['https://www.linkedin.com/in/aleetta-mariya-sebastian-029114294'],
  ],
  ['Lisha Jins', 'Vice Chairperson', ['https://www.linkedin.com/in/lisha-jins']],
  ['Steve Jose', 'Secretary', ['https://www.linkedin.com/in/stevejose087']],
  ['Anna Rachel Mathew', 'Joint Secretary', ['https://www.linkedin.com/in/annarachelmathew']],
  ['Amanul Farhan K S', 'Treasurer', ['https://www.linkedin.com/in/amanulfarhan']],
  [
    'Abel S Mathew',
    'Research & Development Lead',
    ['https://www.linkedin.com/in/abel-s-mathew-7b3035202'],
  ],
  [
    'Saniya K Shibu',
    'Program Outreach Coordinator',
    ['https://www.linkedin.com/in/saniya-k-shibu-1286b230a'],
  ],
  [
    'Sebin Mathew',
    'Project Coordinator',
    [
      'https://sebin-gg.vercel.app',
      'https://github.com/sebin-gg',
      'https://www.linkedin.com/in/sebin-gg',
    ],
  ],
  ['Anjitha Aravind', 'Operations Lead', ['https://www.linkedin.com/in/anjitha-aravind-0048bb32a']],
  ['Abhirami P', 'Design Lead', ['https://www.linkedin.com/in/abhirami-p-4b3786335']],
  ['Devadarsana R', 'Public Relations Lead', ['https://www.linkedin.com/in/devadarsana-r-creates']],
];

export function siteJsonLd(origin = SITE_ORIGIN) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${origin}/#organization`,
        name: 'FOCES - Forum of Computer Engineering Students',
        alternateName: 'FOCES',
        url: origin,
        logo: `${origin}/og-image.jpg`,
        email: 'foces@ceconline.edu',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Chengannur P.O.',
          addressLocality: 'Alappuzha District',
          addressRegion: 'Kerala',
          addressCountry: 'IN',
        },
        sameAs: [
          'https://www.facebook.com/focescec',
          'https://www.instagram.com/foces_cec',
          'https://x.com/foces_cec',
          'https://www.linkedin.com/in/foces-cec-423176229/',
        ],
        // Execom roster as schema.org members — the entity link that lets
        // search engines and AI crawlers resolve each name on the team page
        // to that person's public profile. sameAs only carries profiles that
        // are publicly verifiable (self-declared LinkedIn/GitHub/portfolio).
        member: EXECOM_MEMBERS.map(([name, jobTitle, sameAs]) => ({
          '@type': 'Person',
          name,
          jobTitle,
          sameAs,
        })),
      },
      {
        '@type': 'WebSite',
        '@id': `${origin}/#website`,
        url: origin,
        name: 'FOCES - Forum of Computer Engineering Students',
        publisher: { '@id': `${origin}/#organization` },
      },
    ],
  });
}

/**
 * Google Event structured data (schema.org/Event) for every event in
 * `featuredEvents` (src/data/events.js). Dates come from the per-event
 * `startDate`/`endDate` ISO fields; `location` from the shared default.
 * Returns an @graph — one JSON-LD script for all events keeps <head> tidy.
 *
 * @param {Array<object>} events - entries from src/data/events.js
 * @param {string} [origin] - canonical origin (overridable for tests)
 * @returns {string} the JSON document (callers assign it to a script's
 *   textContent — never an HTML string, so no tag-stripping regex is needed)
 */
export function eventJsonLd(events, origin = SITE_ORIGIN) {
  const graph = (events || []).map((event) => ({
    '@type': 'Event',
    name: event.name,
    description: event.desc,
    startDate: event.startDate,
    endDate: event.endDate || undefined,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    location: {
      '@type': 'Place',
      name: 'College of Engineering Chengannur',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Chengannur P.O.',
        addressLocality: 'Alappuzha District',
        addressRegion: 'Kerala',
        addressCountry: 'IN',
      },
    },
    organizer: {
      '@type': 'Organization',
      name: 'FOCES - Forum of Computer Engineering Students',
      url: origin,
    },
    ...(event.websiteUrl ? { url: event.websiteUrl } : {}),
  }));

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': graph,
  });
}
