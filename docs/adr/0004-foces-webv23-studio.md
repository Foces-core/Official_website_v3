# 0004 — Keep the foces-webv23 Sanity Studio In-Repo, Untooled

Status: Accepted
Date: 2026-08-07

## Context

`foces-webv23/` is the Sanity CMS studio used to author content for the
previous website generation. The current site no longer consumes it, but the
studio remains the editable record of that content model and is occasionally
used to publish older content. It is a separate package pinned to Sanity 3 /
React 18 (a dependency of the studio toolchain) with its own `yarn.lock`.

## Decision

Keep `foces-webv23/` in the repository, but make it invisible to all root
tooling. It is excluded from ESLint (`eslint.config.js` ignores), Prettier
(`.prettierignore`), the build, and CI. It is never linted, formatted, or
built from the repo root. Full rationale and working instructions live in
`foces-webv23/README.md`.

## Consequences

- Positive: the old CMS and its content model stay recoverable and editable
  without polluting the main build or forcing the root's pnpm/React 19
  toolchain onto a Sanity/React 18 package.
- Negative: two package managers (pnpm at root, yarn in the studio) live side
  by side; a naive agent might "fix" the studio to match the root and break
  it.
- Follow-up: if the CMS is fully retired, delete the directory and
  `src/utils/sanityImage.js` together. Until then, treat it as archived-but-
  live, not dead code.
