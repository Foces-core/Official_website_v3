# 0007 — Interactive Widgets Own Their Touch Gesture

Status: Accepted
Date: 2026-08-14

## Context

On phones, rotating the About cube or the Execom team cube dragged the page
with the finger: the widgets used `touch-action: pan-y`, so the browser
claimed any vertical component of the gesture and scrolled mid-rotation
(diagonal drags in particular jumped the viewport).

## Decision

Every interactive rotation/carousel widget owns its touch gesture entirely:
`touch-action: none` on the draggable element (About cube, `.execom-swiper`,
`.execom-cube-swiper`), plus a non-passive pointermove preventDefault while
dragging — `useCarousel` registers its pointermove listener natively with
`{ passive: false }` and calls `preventDefault()` on every move while
dragging, so the page cannot scroll mid-gesture regardless of any event
delegation policy. See the code comments in `AboutUs.css`,
`Execom/custom.css`, and `AboutUs.jsx`.

## Consequences

- Positive: rotating never scrolls the page, on any phone.
- Negative: a vertical swipe that _starts on_ the widget no longer scrolls
  the page — the user must start the scroll elsewhere. Accepted for the
  small cube; for wide widgets this is why Swiper's own `pan-y` default was
  deliberately overridden.
- Follow-up: any new draggable widget must decide its gesture ownership up
  front and add the `touch-action` rule with it.
