# 0019 — Prerendered route snapshots, per-route head tags, and event structured data

Status: Accepted
Date: 2026-09-26

## Context

The site is a JS-mounted SPA: crawlers and link-preview bots saw only the
inline boot splash ("Loading..."), because every route's content (and even
its `<title>`-adjacent metadata) arrived only after React mounted. ADR-0017
made the site indexable, but what crawlers could actually read remained one
sentence. Per-route titles/descriptions, Open Graph tags, and machine-readable
event data did not exist at all.

## Decision

1. **Per-route head tags.** A pure module (`src/utils/seoMeta.js`) owns the
   title/description/OG/Twitter/canonical content for `/`, `/events`,
   `/contact`. `Seo.jsx` applies it at runtime (client-side navigations), and
   the prerender step bakes the same values into the static HTML.
2. **Event JSON-LD.** `src/data/events.js` gains ISO `startDate`/`endDate`
   (optional, validated by `validateEvents`); `seoMeta.eventJsonLd` emits a
   schema.org `@graph` of `Event` entries rendered on `/events`. The
   human-facing `date` label is unchanged.
3. **Build-time prerender.** `pnpm build` now runs `scripts/prerender.mjs`
   after `vite build`: it serves `dist/` locally, renders each route in
   headless Chromium (scrolling so ScrollGate sections mount), and writes
   `dist/events/index.html`, `dist/contact/index.html`, and an updated
   `dist/index.html` — the fully-rendered DOM as the static payload.
   Verification is built in: each snapshot must contain route-specific
   content and match `seoMeta`'s head tags, or the build fails.
   `SKIP_PRERENDER=1` opts out.
4. **No-JS fallback.** `index.html` gains a `<noscript>` block with the club
   essentials (plain HTML text).
5. **No framework migration.** Vercel's rewrites already fall back
   extension-less paths to the SPA shell; the prerendered files shadow them
   because real files win over rewrites. Users keep the identical SPA.
6. **Session-injected link tags are stripped.** Scrolling the page to mount the
   ScrollGate sections makes Vite's preload helper append a `<link>` per chunk
   and per lazy stylesheet, pointed at the prerender script's throwaway server.
   Serializing those would bake `http://127.0.0.1:4179` into production HTML and
   turn every lazy section into an eager boot download — defeating the very
   deferral ScrollGate exists for (`tests/scroll-gate.spec.js` caught this).
   `stripSessionLinks` removes them, and a build-time check fails the run if that
   origin ever reaches a snapshot.
7. **A missing browser degrades, it does not fail.** Vercel's build image ships
   no Chromium, so prerendering there would otherwise break every deploy.
   Without a browser (or with one that cannot launch) the script warns and exits
   0: the SPA shell, the head tags and the `<noscript>` summary still ship, only
   the snapshots are skipped. `PRERENDER_STRICT=1` restores fail-fast for CI and
   local runs. `vercel.json` installs Chromium best-effort so production still
   gets the snapshots.

## Consequences

- **Positive:** Crawlers and link previews see real content per route;
  events can surface as Google rich results; no new runtime dependency and
  no user-facing behavior change.
- **Negative / trade-offs:** Builds require a Chrome/Chromium binary
  (`CHROME_PATH` or Playwright's — already a test dependency) and take
  ~10s longer; prerender runs where Chrome is unavailable can set
  `SKIP_PRERENDER=1`. Snapshots are as stale as the last build — event data
  changes require a redeploy (already the case for the whole site, since
  content is static data).
