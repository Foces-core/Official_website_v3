# 0013 — Viewport Navigation Coordinator and Hero Waves Stage Adapter

Status: Accepted  
Date: 2026-08-16

## Context

During the codebase architecture review, two areas of high friction and shallow module coupling were identified:

1. **Navigation & Overlay Coordination:** Overlay dismissal (mobile navbar drawer), ref-counted body scroll-locks (`scrollLock.js`), double-rAF paint deferrals (`deferToNextPaint`), and section scrolling were scattered across multiple components (`Navbar.jsx`, `Modal.jsx`, `App.jsx`). Callers had to orchestrate timing and lock releases manually.
2. **Hero WebGL Stage Lifecycle:** `HeroSection.jsx` contained 40+ lines of low-level Three.js and Vanta Waves dynamic importing, iOS WebGL context loss listeners, background scheduler calls, and error handling inside a React `useEffect`, mixing visual markup with low-level canvas engine management.

## Decision

1. **Unified Navigation Coordinator (`src/utils/navigationCoordinator.js`):**
   - Encapsulates section navigation (`coordinateSectionNavigation`) with automatic overlay closure, double-rAF paint deferral, reduced-motion behavior mapping, and onComplete callback dispatch.
   - Provides idempotent overlay scroll-locking (`manageOverlayScrollLock`) unifying modal and drawer lock management behind a single seam.
   - Guarded by pure unit tests in `tests/unit/navigationCoordinator.spec.js`.

2. **Hero Waves WebGL Stage Adapter (`src/Components/HeroStage/heroWavesStage.js`):**
   - Encapsulates Three.js and Vanta Waves dynamic loading, low-power/wide-screen gating (`shouldInitHeroWaves`), background priority task scheduling, iOS WebGL context-loss cleanup, and instance teardown (`destroy`).
   - Reduces `HeroSection.jsx` to declarative UI presentation and a 3-line lifecycle effect.
   - Guarded by unit tests with mock schedulers and loaders in `tests/unit/heroWavesStage.spec.js`.

## Consequences

- **Positive:** Deep modules with high locality and leverage. Presentation components are now purely declarative; complex timing, locks, and WebGL lifecycle are fully testable in isolated Vitest suites.
- **Negative / trade-offs:** Introduces two new modules in `src/utils/` and `src/Components/HeroStage/`, guarded by ADR-0009 spec verification.
