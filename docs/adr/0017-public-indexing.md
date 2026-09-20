# 0017 — Public indexing: lift the staging no-index

Status: Accepted  
Date: 2026-09-20

## Context

ADR-0012 configured crawler exclusion (`noindex, nofollow` meta,
`X-Robots-Tag` header, blocking `robots.txt`) "pending official release
forks". The site is now the official public FOCES presence, and the club
wants it discoverable — search results, link previews, and sharing all
depend on indexing.

## Decision

Remove every indexing blocker and actively point crawlers at the site:

1. **`index.html`:** drop the `<meta name="robots" content="noindex,
nofollow" />` tag; add `<link rel="sitemap" href="/sitemap.xml" />`
   alongside the existing canonical.
2. **`vercel.json`:** remove the site-wide `X-Robots-Tag: noindex,
nofollow` header. All other security headers stay.
3. **`public/robots.txt`:** replace `Disallow: /` with `Allow: /` plus a
   `Sitemap:` pointer.
4. **`public/sitemap.xml` (new):** single sitemap covering `/`, `/events`,
   `/contact` — one sitemap serves all engines (Google, Bing, DuckDuckGo…);
   per-engine files are not a thing. Engines are registered via Search
   Console / Bing Webmaster Tools, which need owner-issued verification
   codes, not repo changes.

Supersedes item 3 of ADR-0012 (its contact-draft and pre-compression
decisions are unaffected).

## Consequences

- **Positive:** The site becomes indexable and shareable; canonical + OG
  tags (already in place) now resolve to the official domain.
- **Negative / trade-offs:** Any future staging environment must re-add
  crawler exclusion itself (per-deploy, e.g. a preview-only header) rather
  than inheriting it from this repo's defaults.
