# 0008 — Lazy Chunk Errors Recover Before Surfacing the Error Screen

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
`chunk-reload-retry:<chunk-id>` session flag (no reload loops per lazy chunk),
and never crashes when `sessionStorage` itself is unavailable. If that reload
repeats a recognized chunk-load error, the section fallback performs one
bounded cache recovery: purge this origin's caches, unregister its service
workers, then reload. The recovery is skipped offline and will not repeat after
its session guard is spent. A successful import clears only that chunk's retry
flag. Non-chunk render errors continue to surface without clearing browser
state.

## Consequences

- Positive: background-tab eviction, stale deployment hashes, and transient
  network drops recover seamlessly instead of stranding the user on the
  error fallback.
- Positive: one recovery policy for every chunk — no route is more fragile
  than another.
- Positive: a stale app-shell or service-worker cache gets one clean recovery
  before a chunk error is shown.
- Negative: if the chunk still fails after cache recovery, the fallback remains
  so the user can retry; genuinely broken render code still surfaces.
- Follow-up: new lazy sections must use `lazyWithRetry`, not bare `lazy()`.
