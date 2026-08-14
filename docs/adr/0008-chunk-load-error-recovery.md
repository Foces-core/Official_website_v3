# 0008 — Lazy Chunks Recover Automatically, Never Surface the Error Screen

Status: Accepted
Date: 2026-08-14

## Context

On iPhone SE (2nd gen), leaving the site in a background tab for a long time
and returning could show the error fallback ("Something went wrong" /
"Refresh Page"): iOS evicts memory and stale chunk requests fail, and the
routes' `lazyWithRetry` recovery did not cover the home-page sections, which
used plain `lazy()`.

## Decision

Every lazy chunk in the app — the three routes _and_ the below-the-fold home
sections in `App.jsx` — loads through `lazyWithRetry`
(`src/utils/lazyWithRetry.js`): on a chunk-load failure it retries once
after 300ms, then performs a single clean page reload guarded by a
`chunk-reload-retry` session flag (no reload loops), and never crashes when
`sessionStorage` itself is unavailable. The ErrorBoundary remains as the
final safety net for genuine render errors, not for recoverable chunk
failures.

## Consequences

- Positive: background-tab eviction, stale deployment hashes, and transient
  network drops recover seamlessly instead of stranding the user on the
  error fallback.
- Positive: one recovery policy for every chunk — no route is more fragile
  than another.
- Negative: a second failed load after the reload still surfaces the
  fallback (the flag is one-shot by design); genuinely broken code should
  surface.
- Follow-up: new lazy sections must use `lazyWithRetry`, not bare `lazy()`.
