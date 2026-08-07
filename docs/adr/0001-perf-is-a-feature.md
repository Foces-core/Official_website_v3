# 0001 — Performance Is a Feature: Device-Profile Degradation

Status: Accepted
Date: 2026-08-07

## Context

The site targets students on mixed hardware, including low-end phones on slow
mobile networks. Forcing the full desktop experience (WebGL hero, animations,
large payloads) on those devices produces poor Core Web Vitals and a bad
first impression.

## Decision

Every heavy behavior is gated behind `useDeviceProfile` (`src/hooks/
useLowPower.js`), which reports `slowNetwork`, `lowPower`, `lowCPU`, and
`reducedMotion`. Slow/low-end devices get: no boot splash, no WebGL hero /
cube / grain, lazy below-fold chunks and images, and no prefetch. Heavy
animated content is always forced visible via the AOS safety net in
`App.css` — gating reduces motion, it never hides content.

## Consequences

- Positive: small payloads and fast interactive time on slow/low-end devices
  without maintaining a separate mobile build.
- Negative: a few hero animations are absent on capable-but-slow devices; the
  trade is accepted by design.
- Follow-up: new features must hook into `useDeviceProfile`; removing these
  guards is a regression, not a cleanup.
