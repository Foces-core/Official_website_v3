# 0022 — Required checks: promote commit-message validation, require scoped commits

Status: Accepted
Date: 2026-10-02

## Context

Two documented contracts were not actually enforced.

`Validate commit messages` ran on every PR as a CI job, but it was not in
branch protection's `required_status_checks`, so a red commitlint job was
advisory — it showed up as a failing check next to three green ones and still
merged. CONTRIBUTING.md had already been prescribing the four-check gate
("require the `Lint & Build`, `E2E (Playwright)`, `Probes (structural
checks)` and `Validate commit messages` status checks before merge"), so the
documented contract and the configured protection disagreed. Meanwhile AGENTS.md
§3.1 documents the format as `type(scope):`, but
`commitlint.config.cjs` only extended `@commitlint/config-conventional`, which
leaves scope optional: a bare `chore: no scope` passed both the husky hook and
CI. The stated rule and the checked rule disagreed there too.

## Decision

1. **Add `Validate commit messages` to
   `required_status_checks.contexts`** on `main`, making four required checks
   alongside `Lint & Build`, `E2E (Playwright)` and `Probes (structural
checks)`. `strict: true` was already set, so heads must still be up to date
   with the base.
2. **`'scope-empty': [2, 'never']`** in `commitlint.config.cjs`. Type enum,
   header length and the `a11y` custom type are unchanged; only the missing
   scope becomes an error.
3. **Docs reconciled to four** — AGENTS.md §2.3 (the gate list and the bot-conflict
   routine) and the forward pointer in ADR-0021. The two bot auto-merge
   workflows already poll exactly these four names, so their gate and
   branch protection now agree instead of overlapping by accident.

## Consequences

- **Positive:** a scopeless-but-conventional commit cannot land, and the
  message-format gate is a real merge blocker rather than a suggestion. The
  format AGENTS.md §3.1 documents is now the format CI checks.
- **Negative / trade-offs:** the `commitlint` job is gated on
  `pull_request`/`workflow_dispatch`, so it never reports on a `push`. A
  required check that never reports blocks that push — meaning a **direct push
  to `main` is now impossible even for an admin**, not just discouraged. That
  matches AGENTS.md §2.3 ("Never push straight to `main`"), but it removes the
  escape hatch a hotfix might have wanted; route hotfixes through a PR.
- **Follow-ups:** bots already commit with scopes (Renovate and Dependabot both
  emit `chore(deps): …`), so no bot config change is expected. If one ever
  opens a scopeless commit, fix the bot's message template — do not relax
  `scope-empty` to unblock it.
