# 0009 — Behavior Lives in Pure Tested Modules; Components Are Wiring

Status: Accepted
Date: 2026-08-14

## Context

Unit coverage was uneven: dense behavior (cube physics, easter-egg counting,
anchor-scroll decisions, carousel wrap math, install-cookie logic, splash
timing) sat untested inside components, and the four JSX specs that did exist
each copy-pasted the same `createRoot`/`act` boilerplate. A real bug — the
sticky `found` state in `App.jsx` that stopped repeat anchor navigations from
scrolling — survived because E2E only exercised the first navigation.

## Decision

Two conventions, applied to every logic-bearing change:

1. **Extract decisions to pure modules** behind small interfaces, colocated
   with their component (`easterEggLogic.js`, `cubePhysics.js`,
   `confettiSim.js`, `carouselWrap.js`) or in `src/utils/` for app-level
   logic (`scrollToSectionLogic.js`, `sessionCookie.js`,
   `bootSplashLogic.js`). Components keep the DOM/effect machinery; the math
   and decisions are unit-tested deterministically.
2. **One shared render harness** — `tests/unit/harness.jsx` (a `createRoot`
   - `act` wrapper) — for the remaining component/hook seams that must be
     observed through rendering. E2E stays the arbiter of full interactions.

## Consequences

- Positive: every tuning knob and decision is pinned by a fast unit test;
  refactors and tweaks stop risking the feel of the cube or the behavior of
  navigation.
- Positive: the harness removed the per-spec boilerplate duplication.
- Negative: a little more indirection — a decision lives a directory away
  from the component that uses it.
- Follow-up: new logic should land as a pure module with its spec in the
  same change (red → green), and component tests should use the shared
  harness rather than re-creating roots.
