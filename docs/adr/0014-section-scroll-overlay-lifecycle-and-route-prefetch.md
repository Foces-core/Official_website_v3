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
   - Encapsulates immediate try, `MutationObserver` for lazy Suspense chunk mounts, failsafe polling, single-scroll guards, and cancel handles behind a single testable, pure interface.
   - `App.jsx` delegates cross-route section scrolling to `scrollToSectionWhenReady`, shrinking its inline effect to 2 lines.

2. **Decompose Overlay Hooks & Pure Helpers (`overlayLifecycle.js`, `useScrollLock`, `useEscapeClose`, `useFocusTrap`, `useFocusRestore`):**
   - Retained pure helpers in `src/utils/overlayLifecycle.js` (`findFocusableElements`, `trapTabFocus`, `handleOverlayEscape`).
   - Avoided a monolithic god-hook; split into small, focused hooks:
     - `useScrollLock`: Reference-counted body scroll locking.
     - `useEscapeClose`: Focused Escape key listener.
     - `useFocusTrap`: Focused Tab / Shift-Tab cycle lock within a container.
     - `useFocusRestore`: Focus entry and next-paint restoration on close/unmount (WCAG 2.4.3 Focus Order).
   - `Navbar.jsx` (mobile drawer) composes all four hooks.
   - `Modal.jsx` (event lightbox) uses only `useScrollLock` and `useFocusRestore`, avoiding duplicate or competing focus trap / Escape handlers with the vendor lightbox (`yet-another-react-lightbox`).

3. **Pure Prefetch Manager (`routePrefetchLogic.js` & `useRoutePrefetch.js`):**
   - Deepened `src/utils/routePrefetchLogic.js` into a pure Prefetch Manager owning route registry (`registerPrefetchRoute`), connection/Data-Saver gating (`shouldPrefetchConnection`), idle scheduling (`scheduleIdlePrefetch`), and ForesightJS ML integration (`initForesightPrefetch`).
   - `useRoutePrefetch.js` is a thin wiring hook binding the manager to React lifecycle (ADR-0009 / ADR-0010 pattern).

## Consequences

- **Locality:** Section scrolling, overlay focus/escape/trapping, and route prefetching each have a single authoritative owner.
- **Composition over Monoliths:** Dialogs, drawers, and vendor lightboxes only consume the specific overlay behaviors they need without fighting vendor focus traps.
- **Testability:** All behaviors are 100% unit-tested via `tests/unit/` specs and JSX harnesses (49 test files, 431 unit tests).
- **Accessibility:** Modal lightbox now properly restores focus to the triggering event card upon dismissal (WCAG 2.4.3 compliance).
- **Simplicity:** `Navbar.jsx` shed over 60 lines of imperative effect logic, becoming a declarative wiring component.
