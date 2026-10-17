# 0023 — Carousel Autoplay Requires Visibility Observation

Status: Accepted
Date: 2026-10-17

## Context

When `IntersectionObserver` is unavailable, the carousel fallback started
autoplay timers unconditionally. Responsive desktop/mobile copies and offscreen
carousels could keep advancing despite being hidden, including team copies that
share selection state.

## Decision

Autoplay runs only when visibility can be observed. If
`IntersectionObserver` is unavailable, carousels remain manually navigable but
do not start automatic timers.

## Consequences

- Positive: hidden copies and offscreen carousels cannot advance in lockstep or
  consume background timer work.
- Negative: browsers without `IntersectionObserver` do not get autoplay; manual
  controls remain available.
