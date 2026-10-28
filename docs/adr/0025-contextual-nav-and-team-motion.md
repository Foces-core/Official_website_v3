# 0025 — Contextual Navigation and Face-Aligned Team Motion

Status: Accepted
Date: 2026-10-28

## Context

The desktop Execom cube exposed one member at a time despite room for several cards. The About cube's continuous idle rotation regularly stopped between faces, obscuring its labels. The same six navbar links appeared on home, events, and contact, even when sections did not exist on the current route.

## Decision

`TeamCarousel` uses the existing flat, responsive multi-card mode on desktop; mobile keeps its cube and low-power flat fallback. The About cube pauses on each 90-degree face between visibility-gated idle turns, while its celebration shake uses a shorter, damped motion. `navItemsForPath` selects route-relevant links; the existing navigation actions, keyboard tab stop, and home scrollspy remain shared.

## Consequences

- Positive: more team portraits are visible on desktop, cube labels rest legibly, and subpage navigation is shorter.
- Negative / trade-offs: idle motion is less continuous, and some home-section links are absent from subpage menus.
- Follow-ups: Playwright covers both layouts, cube resting behavior, and desktop/mobile route menus.
