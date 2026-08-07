# 0002 — PWA Precache Is App-Shell Only

Status: Accepted
Date: 2026-08-07

## Context

The first version of the PWA precached every asset, including ~2 MB of event
photos. On a slow network that made first-visit download the entire site —
exactly the case `useDeviceProfile` tries to protect. The photo set also
changes with every event, so stale precache content was wasted bytes.

## Decision

`vite.config.js` (VitePWA/workbox) precaches only the app shell
(`**/*.{js,css,html,svg,woff2}`), capped at 1 MB per file, with Three.js and
non-latin font subsets explicitly ignored. Images ship via Vercel's
immutable HTTP cache (`/assets/*` has a year-long Cache-Control) instead of
the service worker.

## Consequences

- Positive: first visit downloads only what renders; repeat visits are cheap;
  updating event photos never invalidates a stale precache.
- Negative: offline support does not include the latest photos — acceptable,
  since the app shell is what makes the site load offline.
- Follow-up: keep `globPatterns`/`globIgnores` aligned with any new chunk or
  font; do not add images to the precache.
