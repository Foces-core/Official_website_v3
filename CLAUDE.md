# Claude Agent Guide — FOCES Official Website

Instructions and invariants for Claude working in this repository.

## Critical Pointers

- **Architecture decisions:** [`docs/adr/`](docs/adr/README.md) (ADR-0001 through ADR-0010).
- **Agent instructions & map:** [`AGENTS.md`](AGENTS.md).
- **Domain glossary:** [`CONTEXT.md`](CONTEXT.md) and [`UBIQUITOUS_LANGUAGE.md`](UBIQUITOUS_LANGUAGE.md).
- **Standards & contributing:** [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Non-Negotiable Invariants

1. **`foces-webv23/` is OFF-LIMITS:** Archived Sanity studio. Never lint, build, or upgrade it.
2. **Package manager:** Use **pnpm** exclusively in the repository root.
3. **Commit convention:** Conventional Commits only (`feat|fix|perf|a11y|chore|docs|test|refactor|ci|build|style|revert(scope):`).
4. **Pure module seam contract (ADR-0009):** Logic lives in pure tested `.js` modules under `src/utils/`, `src/data/`, `src/hooks/`, `src/Components/`, and `src/Pages/`. Components are JSX wiring. Every pure module must be imported by a unit test in `tests/unit/` (`pnpm check:specs`).
5. **Performance & accessibility:** Performance degrades gracefully on low-end devices via `useDeviceProfile()` (`slowNetwork`, `lowPower`, `reducedMotion`). Respect WCAG 2.2 keyboard and motion contracts.
6. **No dead code:** Clean up unused imports, dead exports, and unused styles (`pnpm knip`).

## Verification Commands

Run the deterministic verification suite before committing:

```bash
pnpm verify          # Runs lint, format:check, test:unit, check:specs, check:assets, check:sw, build, git diff --check
pnpm lint:workflows  # Runs actionlint + shellcheck on .github/workflows/
pnpm test            # Runs Playwright E2E suite
```
