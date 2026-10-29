# 0028 — Cinematic Entry Curtain

Status: Accepted
Date: 2026-10-29

## Context

The first visit should feel like a reveal: a full-screen pair of panels that parts on the user's first action. It must appear on every device tier — including 2G and low-power, where the rest of the site's ambient motion is gated off.

## Decision

`Curtain` mounts at the app root and always renders two fixed panels plus a hint label. It is static content, not an ambient effect, so `useDeviceProfile` does not gate it. The first `pointerdown`, `wheel`, `touchmove`, Enter, or Escape opens it; `pointer-events: none` lets that same interaction reach the page beneath. Under `data-motion-reduced='true'` the parting transition and hint pulse are suppressed — the reveal still happens, instantly.

## Consequences

- Positive: a consistent cinematic entry on every tier, with a11y preserved (instant open under reduced motion, no event swallowed, `aria-hidden` overlay).
- Negative / trade-offs: one extra overlay on first paint; keyboard users see no hint beyond the label (screen readers skip it via `aria-hidden`).
- Follow-ups: E2E covers Enter-open on chromium; the pure `isRevealKey` decision is unit-tested.
