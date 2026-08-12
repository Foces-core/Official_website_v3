# 0006 — Knip Guards Against Dead Code and Unused Dependencies

Status: Accepted
Date: 2026-08-12

## Context

"No dead code" is a hard rule (see `CONTRIBUTING.md` / `AGENTS.md`), but it
had no automated guard — unused exports, dependencies, and asset variants
could accumulate silently until a manual audit caught them. With many utility
modules and webp variants in `src/assets`, drift was easy to introduce and
hard to notice in review.

## Decision

[knip](https://knip.dev) runs as a CI step (`pnpm exec knip` in
`.github/workflows/ci.yml`, wired through the `knip` script in `package.json`
and configured in `knip.json`). Entry points are the app entry, the Vite and
Playwright configs, the `scripts/` tree (probes + maintenance), and the tests;
everything else under `src/` is scanned for unused exports and imports.

Two false positives are deliberately ignored, with the reasons recorded
inline in `knip.json`:

- **`tailwindcss` in `ignoreDependencies`** — Tailwind v4 is consumed via
  CSS `@import` plus the `@tailwindcss/postcss` plugin, never imported from
  JS, so knip cannot trace the dependency through CSS and would otherwise
  report it as unused.
- **`ffmpeg` / `ffprobe` in `ignoreBinaries`** — these are system binaries
  invoked by `scripts/maintenance/extract-frames.mjs` at runtime, not npm
  dependencies, so they are outside knip's dependency graph.

## Consequences

- Positive: pull requests now fail CI when dead code or unused dependencies
  are introduced; the check lives in the same lint job, so feedback is fast;
  the allowlist documents _why_ each entry stays, so future readers don't
  "clean up" a legitimate entry.
- Negative: the `entry`/`project` globs must stay in sync as the `scripts/`
  and `tests/` layout evolves; `ignoreDependencies` grows if new
  CSS-consumed or side-effect-only packages are added.
- Follow-up: done 2026-08-12 — the orphaned webp variants in `src/assets`
  (unreferenced event photos) were pruned manually, and the maintenance
  scripts were trimmed so they only regenerate assets the site imports. If
  knip later gains asset/file reporting, keep `src/assets` under that guard.
