# 0029 — Remove the PWA Service Worker

Status: Accepted
Date: 2026-10-30

## Context

Supersedes [0002](0002-pwa-shell-only-precache.md). The workbox service
worker (app-shell precache + `chunks-cache-v1`/`images-cache-v3` runtime
caches) was the recurring source of stale-chunk failures: any tab open
across a deploy kept an old `index.html`, and cached/404'd chunk responses
surfaced as every lazy section below the header falling into its error
fallback at once. A college forum site has no offline requirement that
justifies this machinery.

## Decision

`vite-plugin-pwa` is removed entirely (`vite.config.js`, `package.json`,
`check-sw-precache.mjs`, `remove-legacy-image-cache.js`,
`offline-resilience.spec.js`). `public/sw.js` ships a self-destructing
worker at the same URL so already-registered workers update into it, wipe
every cache, unregister, and navigate open tabs back to the network. The
manual Retry path still purges caches and unregisters stragglers via
`src/utils/cacheRecovery.js`.

## Consequences

- Positive: no SW-induced stale shells or poisoned chunk caches; one less
  build plugin and its precache/runtime-cache config to maintain.
- Negative: no offline support and no installable PWA — accepted, the site
  has neither need.
- Follow-ups: none. Re-adding a service worker requires a new ADR.
