# 0018 — Idle-reveal controls and hide-on-scroll navbar

Status: Accepted  
Date: 2026-09-20

## Context

The fixed navbar and the carousel navigation (arrows, dots) are permanent
visual chrome: they compete with content on every screen, especially on
phones. The site's visual language is dark and minimal, so persistent
controls read as clutter.

Constraints from the existing contract:

- **A11y is non-negotiable** (WCAG 2.1/2.2): keyboard focus must always be
  visible, so a control that can take focus may never be hidden while
  focused; hidden controls must still be keyboard-reachable in practice
  (revealed on focus).
- **Touch has no hover** (ADR-0007 family): hover-driven reveals need a
  touch-specific policy (see the advisor portrait's reveal-on-view).
- Behavior lives in pure tested modules; components are wiring (ADR-0009).

## Decision

1. **Idle reveal (`src/utils/idleReveal.js` + `src/hooks/useIdleReveal.js`):**
   controls start visible; pointer/key/wheel/touch activity inside the
   target area keeps them visible; after `idleMs` (2500ms default) of
   silence a pure decision (`shouldShowIdleReveal`) hides them. The hide
   check never fires while focus is inside the target (re-arms instead).
   An optional `pulse` input (the carousel's active index) re-reveals
   without pointer activity — used by the dots, which are slide-change-
   driven, deliberately NOT shared with the arrows' pointer-driven timer.
   The hook fails open: any failure leaves controls always visible.
2. **Hide-on-scroll navbar (`shouldHideNavbar` in navSpy.js):** scrolling
   down past a 4px jitter delta hides the fixed bar; any upward tick or
   proximity to the top (≤80px) reveals it; never under an open mobile
   drawer; `y` is clamped to `[0, maxScroll]` so iOS elastic overscroll
   cannot fake an upward scroll; focusin on the bar reveals it. The
   translate transition is `motion-safe:` gated (reduced-motion users get
   an instant cut).
3. **Prefetch adjacency (`neighborIndices` in carouselWrap.js):** carousels
   warm the HTTP cache for active ±1 via `prioritizeAssetFetch`, so the
   end-of-track slides do not stall on first view; revisits were already
   instant through BlurImage's cached-image fast path.

## Consequences

- **Positive:** content-first screens with no dead chrome; both control
  groups stay keyboard-safe; the pattern is one seam (`useIdleReveal`)
  any future surface (e.g. gallery thumbs) can reuse.
- **Negative / trade-offs:** two `useIdleReveal` instances per carousel
  (arrows + dots) is a small state cost for independence; hidden controls
  rely on the pulse/activity contract, so a new control group must pick a
  driver (pointer, pulse, or both) explicitly rather than inheriting one.
