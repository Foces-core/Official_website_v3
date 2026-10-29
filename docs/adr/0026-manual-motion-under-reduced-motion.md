# 0026 — Manual Carousel Motion Under Reduced Motion

Status: Accepted
Date: 2026-10-29

## Context

`:root[data-motion-reduced='true']` removed every transition, so arrow, drag-snap, and keyboard moves on the team carousel and About cube jumped instantly between faces. Rapid arrow presses also restarted the eased curve on each press, and a seamless-wrap rebase could fall back to an instant jump in the middle of a move.

## Decision

Reduced motion still stops autoplay, idle spin, page-entry fades, and ambient effects. A transform transition that the user starts directly (arrows, drag release, cube keys) sets `data-manual-motion='true'` through `src/utils/manualMotion.js`. `src/App.css` keeps only that transform transition, and the hooks remove the attribute when the move settles. While a move is still running, the next press continues linearly from the rendered position (`trackPosition` and `transitionPlan` in `src/utils/carouselGeometry.js`) instead of starting again.

## Consequences

- Positive: explicit navigation keeps its spatial cue, and rapid presses stay smooth across the seamless wrap.
- Negative / trade-offs: users who prefer reduced motion still see short transform transitions (≤420 ms per step) when they act directly. Automatic motion stays off.
- Follow-ups: Playwright covers the cube's 0.4 s manual transition under `?motion=off`, and unit specs cover in-flight retargeting.
