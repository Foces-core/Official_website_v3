import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { seoRoutes, headTagsForRoute, eventJsonLd, siteJsonLd } from '../../utils/seoMeta.js';

/**
 * Per-route head management (title, description, OG/Twitter, canonical) —
 * the wiring half of src/utils/seoMeta.js (ADR-0009: decisions live in the
 * pure module; this component only applies them).
 *
 * No react-helmet: exactly three routes own declarative heads, so a tiny
 * idempotent patcher beats a new dependency and its per-render reconciliation.
 * Effects run after paint, so swapping title/meta costs nothing visible.
 *
 * The prerender snapshotter (scripts/prerender.mjs) applies the same
 * headTagsForRoute() output at build time, so crawlers see this head in the
 * static HTML; this component keeps runtime client-side navigations in sync
 * after that.
 *
 * @param {string} path - route path: '/' | '/events' | '/contact'
 * @param {Array<object>} [events] - featuredEvents; emits the JSON-LD script
 *   when provided (events page).
 */
export default function Seo({ path, events }) {
  useEffect(() => {
    const route = seoRoutes().find((r) => r.path === path);
    if (!route) return;
    const head = headTagsForRoute(route);

    document.title = head.title;

    // Replace each existing tag in place (index.html ships every one of them);
    // outerHTML substitution is idempotent — same input, same tag, no churn,
    // and the selector comes from the pure module so runtime HTML and
    // prerendered HTML can never drift apart.
    for (const { selector, tag } of head.metaTags) {
      const el = document.head.querySelector(selector);
      if (el) {
        el.outerHTML = tag;
      } else {
        const created = document.createElement('template');
        created.innerHTML = tag;
        document.head.appendChild(created.content.firstElementChild);
      }
    }

    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = head.canonical;

    // Site identity structured data: present on every route. index.html ships
    // the same payload statically (no-JS crawlers); this keeps it in sync
    // after client-side navigations and guarantees the prerendered snapshots
    // carry it even if the static copy ever drifts.
    const existingSiteLd = document.getElementById('foces-site-jsonld');
    const siteScript = existingSiteLd ?? document.createElement('script');
    siteScript.type = 'application/ld+json';
    siteScript.id = 'foces-site-jsonld';
    siteScript.textContent = siteJsonLd().replace(/^<script[^>]*>|<\/script>$/g, '');
    if (!existingSiteLd) document.head.appendChild(siteScript);

    // Event structured data: only rendered on the events route.
    const existingLd = document.getElementById('foces-event-jsonld');
    if (events) {
      const script = existingLd ?? document.createElement('script');
      script.type = 'application/ld+json';
      script.id = 'foces-event-jsonld';
      script.textContent = eventJsonLd(events).replace(/^<script[^>]*>|<\/script>$/g, '');
      if (!existingLd) document.head.appendChild(script);
    } else if (existingLd) {
      existingLd.remove();
    }
  }, [path, events]);

  return null;
}

Seo.propTypes = {
  path: PropTypes.string.isRequired,
  events: PropTypes.array,
};
