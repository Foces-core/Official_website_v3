# 0021 — Renovate platform auto-merge, gated on CI

Status: Accepted
Date: 2026-10-02

## Context

`renovate.json` has declared `automerge: true` for minor/patch/pin/digest for a
long time, but that flag was inert: without `platformAutomerge: true` Renovate
only _requests_ a merge, it never asks GitHub to queue one. The result was a
backlog of eleven open bot PRs at once, each merge invalidating the next one's
lockfile — three separate lock-file conflicts inside a single session.

Adding `platformAutomerge: true` alone would not have helped. Branch protection
on `main` sets `required_approving_review_count: 1`, and Renovate cannot approve
its own PRs. Every Renovate PR sat at `reviewDecision=REVIEW_REQUIRED` with zero
approvals and merged only because a human pushed it through the REST bypass — so
platform auto-merge would have queued each PR forever on an approval that never
arrived, reproducing the same inert-configuration failure from the other side.

## Decision

1. **`"platformAutomerge": true`** in `renovate.json`. Renovate now asks GitHub
   to queue the merge for the PRs its own `packageRules` mark `automerge: true`
   — minor, patch, pin, digest and `lockFileMaintenance`. Majors declare no
   `automerge` rule, so they are never queued. `minimumReleaseAge: 1 day` still
   holds every update back before a PR is even opened.
2. **`.github/workflows/renovate-auto-approve.yml`** supplies the missing
   approval, mirroring the existing `auto-merge-dependabot.yml` pattern. It
   polls the four CI checks on the PR head with the same bounded loop, aborts
   on red, and approves — but only when the PR already reports
   `auto_merge != null`, i.e. only when Renovate itself judged the update to
   qualify. The workflow therefore cannot widen Renovate's scope: a major gets
   no approval and stays open for a human.
3. **The three required checks still gate the merge** (`Lint & Build`,
   `E2E (Playwright)`, `Probes (structural checks)`), and CodeQL still runs.
   GitHub cancels auto-merge if any of them fails, so nothing lands on a red
   build. Nothing here weakens protection for human-authored PRs.

## Consequences

- **Positive:** the bot queue drains itself and the lockfile-churn treadmill
  ends; a dependency update no longer needs a human to notice it.
- **Negative / trade-offs:** patch/minor dependency bumps now land with no
  human review and no CodeRabbit review. GitHub auto-merge fires on the
  required checks alone, and CodeRabbit's check reports "Review skipped:
  manual review required", which counts as passing — so this is a deliberate,
  scoped exception to the review loop in AGENTS.md §2.3. The compensating
  control is `minimumReleaseAge: 1 day`: a bad release has a day to surface
  upstream before this repo ever sees it, and CI still has to go fully green.
- **Follow-ups:** `lockFileMaintenance` is included in the same `automerge`
  rule, so those PRs merge themselves too — they are the ones that churned most
  in this repo, since every other merge invalidated their lockfile. What still
  needs a human (or an agent following AGENTS.md §2.3) is the **conflicted**
  case: auto-merge never fires on a dirty head, and Renovate only rebases on its
  own schedule. Revisit this ADR if CodeRabbit's check ever becomes required,
  or if `minimumReleaseAge` is lowered.
