# ADR-0014 — Section Scroll Deepening, Overlay Lifecycle, and Route Prefetch

**Status:** Accepted  
**Date:** 2026-08-16

## Context

The architecture review of 2026-08-16 identified three areas where behavioral logic remained smeared across component effects or duplicated across callers:

1. **Section scrolling orchestration:** `App.jsx` hand-rolled a 45-line inline `MutationObserver` + 5s failsafe polling interval + cancellation flags for lazy-loaded section mounts, bypassing the `navigationCoordinator` seam.
2. **Overlay lifecycle:** The mobile navigation drawer (`Navbar.jsx`) and event lightbox (`Modal.jsx`) independently hand-rolled body scroll locking, focus entry, Tab trapping, Escape dismissal, and focus restoration, leaving a WCAG 2.4.3 focus restoration gap in `Modal.jsx`.
3. **Route chunk prefetching:** `Navbar.jsx` split route prefetching across three effects and an inline handler, duplicating the `slowNetwork` device profile gate in each.

## Decision

1. **Deepen `navigationCoordinator.js`:**
   - Implemented `scrollToSectionWhenReady({ targetId, reducedMotion, timeoutMs, pollIntervalMs, doc, win, ObserverClass, onComplete, onTimeout })` in `src/utils/navigationCoordinator.js`.
   - Encapsulates immediate try, `MutationObserver` for lazy Suspense chunk mounts, failsafe polling, single-scroll guards, and cancel handles behind a single testable interface.
   - `App.jsx` delegates cross-route section scrolling to `scrollToSectionWhenReady`, shrinking its inline effect to 2 lines.

2. **Consolidate Overlay Lifecycle (`overlayLifecycle.js` & `useOverlayLifecycle.js`):**
   - Created pure helpers in `src/utils/overlayLifecycle.js` (`findFocusableElements`, `trapTabFocus`, `handleOverlayEscape`) and the `useOverlayLifecycle` hook.
   - Centralizes ref-counted body scroll locks, initial focus entry, Tab key focus trapping, Escape key dismissal, and next-paint focus restoration.
   - Both `Navbar.jsx` (mobile drawer) and `Modal.jsx` (event lightbox) consume `useOverlayLifecycle`.

3. **Consolidate Route Prefetching (`routePrefetchLogic.js` & `useRoutePrefetch.js`):**
   - Created pure route loader mapping in `src/utils/routePrefetchLogic.js` (`PREFETCHABLE_ROUTES`, `prefetchRoute`, `prefetchDefaultRoutes`) and the `useRoutePrefetch` hook.
   - Encapsulates idle preloading, ForesightJS machine-learning trajectory prediction, and intent handlers behind a unified `slowNetwork` gate.

## Consequences

- **Locality:** Section scrolling, overlay focus/escape/trapping, and route prefetching each have a single authoritative owner.
- **Testability:** All three behaviors are 100% unit-tested via `tests/unit/` specs and JSX harnesses (46 test files, 418 unit tests).
- **Accessibility:** Modal lightbox now properly restores focus to the triggering event card upon dismissal (WCAG 2.4.3 compliance).
- **Simplicity:** `Navbar.jsx` shed over 60 lines of imperative effect logic, becoming a declarative wiring component.
