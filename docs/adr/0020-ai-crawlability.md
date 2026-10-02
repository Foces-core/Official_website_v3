# 0020 — AI crawlability: llms.txt, explicit AI-bot access, site identity data

Status: Accepted
Date: 2026-10-02

## Context

ADR-0019 made the site readable by search crawlers (prerendered snapshots,
per-route heads, Event JSON-LD), but AI assistants had no purpose-built
entry point: no `llms.txt` summary, no explicit AI-fetcher policy in
`robots.txt`, and no site-level identity graph (only events carried
structured data).

## Decision

1. **`public/llms.txt`** — hand-written `llmstxt.org` summary (club, routes,
   events, socials). Event names are pinned to `src/data/events.js` by
   `tests/unit/llmsTxt.spec.js` so the file cannot silently go stale.
2. **`public/robots.txt`** — explicit `Allow: /` entries for the major AI
   fetchers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot,
   Bytespider, …); the wildcard already covered them, the names make the
   intent review-proof. Guarded by the same spec.
3. **Site identity JSON-LD** — `siteJsonLd()` in `src/utils/seoMeta.js`
   (Organization + WebSite), shipped statically in `index.html` for no-JS
   fetchers and kept in sync at runtime by `Seo.jsx` on every route. Static
   and runtime copies are deep-equal-guarded in `tests/unit/seoMeta.spec.js`.

## Consequences

- **Positive:** assistants and AI search can ground on a concise canonical
  summary plus a typed identity graph, instead of scraping rendered pages.
- **Negative / trade-offs:** `llms.txt` event details are only as fresh as
  the last edit — the spec pins names/URLs, not prose; refresh the file when
  events change (same deploy rhythm as the rest of the static content).
- **Follow-ups:** none — no new runtime dependency, no user-facing change.
