# 0024 — Capability-Gated Route Entry Transitions

Status: Accepted
Date: 2026-10-28

## Context

The site has multiple SPA routes, but its page-entry fade only ran on the first load. Motion must remain optional for reduced-motion and low-power profiles, and a capability update during a route must not restart an active fade.

## Decision

`PageEntryTransition` in `src/main.jsx` is keyed by pathname and latches `aosReveals` when each route entry mounts. It fades that entry once, clears its class on its own animation end or cancellation, and ignores bubbled child events. CSS disables the effect for `prefers-reduced-motion`.

## Consequences

- Positive: capable users get the same route-entry treatment on direct loads and in-app navigation.
- Negative / trade-offs: route changes add a 120ms delay and 720ms fade.
- Follow-ups: E2E tests cover all routes, in-app navigation, reduced motion, and profile changes.
