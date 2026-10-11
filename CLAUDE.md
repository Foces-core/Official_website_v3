# Claude Agent Guide — FOCES Official Website

Instructions and invariants for Claude working in this repository.

## Critical Pointers

- **Live Production URL:** [https://focess-five.vercel.app/](https://focess-five.vercel.app/)
- **Architecture decisions:** [`docs/adr/`](docs/adr/README.md) (see the index there for the current range).
- **Agent instructions & map:** [`AGENTS.md`](AGENTS.md).
- **Domain glossary (single, canonical):** [`CONTEXT.md`](CONTEXT.md) — seam definitions, aliases to avoid,
  relationships, and flagged ambiguities. There is no second glossary.
- **Standards & contributing:** [`CONTRIBUTING.md`](CONTRIBUTING.md).## Non-Negotiable Invariants

0. **Windows SWC build bug (known):** `pnpm build` may fail with `ERR_SWC_NATIVE_CACHE`
   ("DACL grants replacement rights") — upstream swc-project/swc#12442, fixed in #12452.
   Workaround on this machine: `SWC_NATIVE_BINDING_CACHE=C:\Users\sebin\.swc-cache`. **`foces-webv23/` is OFF-LIMITS:** Archived Sanity studio. Never lint, build, or upgrade it.
1. **Package manager:** Use **pnpm** exclusively in the repository root.
2. **Commit convention:** Conventional Commits only (`feat|fix|perf|a11y|chore|docs|test|refactor|ci|build|style|revert(scope):`).
3. **Pure module seam contract (ADR-0009):** Logic lives in pure tested `.js` modules under `src/utils/`, `src/data/`, `src/hooks/`, `src/Components/`, and `src/Pages/`. Components are JSX wiring. Every pure module must be imported by a unit test in `tests/unit/` (`pnpm check:specs`).
4. **Performance & accessibility:** Performance degrades gracefully on low-end devices via `useDeviceProfile()` (`slowNetwork`, `lowPower`, `reducedMotion`). Respect WCAG 2.2 keyboard and motion contracts.
5. **No dead code:** Clean up unused imports, dead exports, and unused styles (`pnpm knip`).
6. **CodeRabbit review enforcement:** Automated assertive reviews run on all PRs with `request_changes_workflow: true`. Critical findings must be resolved before merging.

## Verification Commands

Run the deterministic verification suite before committing:

```bash
pnpm verify          # Runs lint, format:check, test:unit, check:specs, check:assets, check:sw, build, git diff --check
pnpm lint:workflows  # Runs actionlint + shellcheck on .github/workflows/
pnpm test            # Runs Playwright E2E suite
```
