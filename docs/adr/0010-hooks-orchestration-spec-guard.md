# 0010 — Orchestration Lives in Hooks; Pure Decisions Stay in Modules

Status: Accepted
Date: 2026-08-15

## Context

ADR-0009 established that behavior lives in pure tested modules and
components are wiring. As the extraction wave matured, the remaining
untested surface was effect orchestration (rAF loops, listeners,
IntersectionObservers) that pairs a tiny pure decision with a lot of
wiring — the cube's drag/wind-down/snap loop, the duplicated carousel
autoplay effect, the triplicated viewport resize ceremony. Two gaps
appeared: "components are wiring" could be misread as forbidding hooks
entirely, and nothing structurally stopped a new pure module shipping
without a spec — coverage thresholds only catch the aggregate drop.

## Decision

1. **Effect orchestration may live in hooks** (`useCubeDrag`,
   `useViewportWidth`, `useAutoplayOnScreen`), as long as every decision
   inside stays a pure tested module behind the hook's seam
   (`cubePhysics`/`cubeTiming`/`easterEggLogic`, `breakpoints`,
   `autoplayGate`). This is a locality move: no module gets deeper, the
   render component gets smaller. Pure modules remain the only place
   decisions are computed.
2. **ADR-0009 is structurally enforced.** `pnpm check:specs`
   (`scripts/maintenance/check-specs.mjs`) fails CI when a pure module
   (the ADR-0009 globs: `src/utils/**`, `src/data/**`, `src/hooks/**`,
   `src/Components/**/*.js`, `src/Pages/**/*.js`) is not imported by any
   unit spec, and the vitest coverage include covers `src/Pages` too.
   Matching is reference-based so repo naming conventions (validator
   spec'd with its data module, hook specs as `.jsx`) all work.

## Consequences

- Positive: the cube drag and carousel seams are unit-testable through
  their hooks, and a future third carousel imports the seam instead of
  copy-pasting.
- Positive: an extraction that lands without its spec fails the PR that
  introduces it — named and fast, not an aggregate coverage drop.
- Negative: hooks add a layer of indirection between the decision module
  and the DOM, and the 300-line `useCubeDrag` looks like a Middle Man if
  read without this record (it is wiring by design).
- Follow-up: keep the hook/pure-module boundary — when a new effect
  needs a decision, extract the decision; when a hook outgrows the
  component, move the wiring, not the math.
