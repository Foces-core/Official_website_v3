# 0015 — Cache-Poison Recovery: SPA Fallback, SW MIME Guard, Error Codes

Status: Accepted
Date: 2026-09-11

## Context

A missing hashed chunk (deploy skew) was served the SPA `index.html` with
HTTP 200 via the `vercel.json` catch-all rewrite, and the Workbox
`chunks-cache-v1` CacheFirst entry cached that HTML-as-JS for 30 days with no
MIME check. Every later import threw `Unexpected token '<'` from cache, so
refresh + return-home replayed the same failure forever; production hides
`error.message`, so users could not self-diagnose.

## Decision

1. `vercel.json`: the SPA catch-all excludes `/assets/*`
   (`/((?!assets/).*)`), so missing chunks 404 honestly instead of 200 HTML.
2. `vite.config.js`: the chunk runtime cache is split into JS/CSS entries
   that only cache exact `content-type` responses
   (`application/javascript` / `text/css` with charset).
3. `isChunkError` (`chunkRecovery.js`) and `SENTRY_IGNORE_ERRORS`
   (`sentryFilter.js`) cover the HTML-as-JS signature
   (`Unexpected token '<'`, `Failed to load module script`,
   `Expected a JavaScript`, `MIME type`).
4. `ErrorFallback` shows a stable `CHUNK-`/`APP-` support code
   (`cacheRecovery.js#getErrorCode`) and a `Clear cache & reload` button that
   purges CacheStorage, unregisters the SW, then reloads.

## Consequences

- Positive: a poisoned cache becomes a one-tap recovery instead of a stuck
  page; deploy-skew noise stays out of Sentry.
- Positive: server fix is primary, SW guard and client purge are
  defense-in-depth — each layer fails safe on its own.
- Negative: the SW MIME guard uses exact content-type match (Workbox
  compares strictly); if the CDN ever changes the charset spelling, chunks
  silently stop caching (extra fetches, never poison).
- Negative: purge-all also drops the image cache (re-download, not data loss).
- Follow-up: keep `isChunkError` and `SENTRY_IGNORE_ERRORS` in sync when new
  loader wordings appear; new lazy sections must keep using `lazyWithRetry`.
