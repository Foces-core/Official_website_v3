# 0016 — Execom Carousels Release Vertical Swipes to Page Scroll

Status: Accepted
Date: 2026-09-17

## Context

ADR-0007 gave every rotation/carousel widget full touch ownership
(`touch-action: none` + unconditional preventDefault), accepting that a
vertical swipe starting on the widget would no longer scroll the page. That
trade-off held for the small About cube, but the Execom cards are ~390px
tall viewport-filling swipe traps: users reported they could barely scroll
up past the team section because the carousel swallowed the gesture.

## Decision

Partially overrules ADR-0007 for the Execom carousels only (About cube
unchanged): `.execom-swiper` and `.execom-cube-swiper` use
`touch-action: pan-y`, and `useCarousel` claims only horizontal-dominant
drags (8px axis lock) — vertical-dominant moves abort the drag with no
preventDefault and no index change, handing the gesture back to the
browser. Pinned by the `data-slide-center` / axis-lock unit specs and the
updated `tests/carousels.spec.js` scroll-release contract.

## Consequences

- Positive: vertical swipes starting on team cards scroll the page; horizontal
  drags still rotate without mid-gesture scroll jumps.
- Negative / trade-offs: steep diagonal drags that start vertical now scroll
  instead of rotating — accepted, since scroll escape matters more on tall
  cards than diagonal-rotation fidelity.
- Follow-ups: none; the About cube keeps full ownership per ADR-0007.
