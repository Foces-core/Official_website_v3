# 🤖 Agent Instructions — FOCES Official Website

Behavioral rules for AI agents (and humans) working in this repository.
Read this before touching anything.

Three numbered sections with stable anchors — cite them in review
(e.g. "violates §2.1") instead of pasting prose:

- **§1 Background** — where things are (read-only orientation).
- **§2 Behaviour** — how to work (contracts, verification, PR flow).
- **§3 Output** — what to emit (commits, PRs, docs).

## §1 Background

- **Live Production URL:** [https://focess-five.vercel.app/](https://focess-five.vercel.app/) — deployed continuously from `main` via Vercel edge.
- **Read first:** architecture/decisions live in `docs/adr/` and the
  performance/a11y contract is in `CONTRIBUTING.md`. This file points at
  those owners — it never duplicates them.
- **Package managers:** root uses **pnpm** (`pnpm install`, `pnpm test`, ...).
  The studio uses **yarn** (inside `foces-webv23/` only). Do not mix.
- **Networked commands:** IF the `sfw` wrapper exists on PATH, prefix
  networked package/tool commands with it — ELSE run the bare command.
  Never install it, never fail when it is absent (it is not installed in
  every environment).

## §1 Map

- `src/App.jsx` — landing page composition (home, about, featuring, events, execom); every lazy
  chunk here loads via `lazyWithRetry` (ADR-0008); cross-route anchor scroll
  decisions come from `scrollToSectionLogic`.
- `src/main.jsx` — router (`/`, `/events`, `/contact`), lazy routes, boot splash (decisions in
  `bootSplashLogic`), StrictMode.
- `src/Pages/` — route-level pages (`LandingPages/`, `EventPage/`).
- `src/Components/` — shared UI (AboutUs, BlurImage, ContactUs, Execom, Grain, InstallPrompt,
  Loader, ScrollGate, SectionSkeleton).
- `src/Components/AboutUs/` — the cube: `easterEggLogic.js` (spin tracker + `SPIN_BARS`),
  `confettiSim.js` (particles), `easterEggCelebration.js`
  (toast/message/EMA policies) — pure modules, the JSX is wiring. Wind-down
  physics live in `src/utils/cubePhysics.js` and timing windows in
  `src/utils/cubeTiming.js`. The motion orchestration (drag/wind-down/snap,
  spin tracking, arrow keys) is `useCubeDrag`.
- `src/Components/BlurImage/` — shared image primitive: `BlurImage.jsx` + `useBlurImage.js`
  (loaded/placeholder/fetch-priority state machine).
- `src/Components/Execom/` — team carousel: `TeamCarousel.jsx`; the wrap math
  (`normalizeIndex`/`wrapTarget`/`copyFor`) is shared from `src/utils/carouselWrap.js`
  with Featuring. The roster lives in `src/data/team.js` (shape-guarded by `validateTeam`).
- `src/Pages/LandingPage/Navbar/` — navbar: scrollspy, next-paint deferral, and nav-action decisions in pure
  `navSpy.js`; viewport buckets come from `breakpoints.js`.
- `src/data/events.js` — **single source of truth** for events (home section + `/events` share it).
- `src/data/team.js` — **single source of truth** for the team roster (`cardData`, `cubeSlides`,
  `advisor`).
- `src/data/echoSlides.js` — **single source of truth** for the Featuring slides
  (`echoSlides` + 3× `carouselSlides`), shape-guarded by `validateEchoSlides`.
- `src/Components/HeroStage/` — 3D WebGL stage adapter: `heroWavesStage.js` (dynamic Three.js/Vanta loader, WebGL context loss recovery, lowPower gating).
- `src/utils/` — helpers: `frameScheduler.js` (coalesceToFrame & deferToNextPaint), `contactSubmitLogic.js` (pure submit outcome resolver),
  `safeStorage.js` (fault-tolerant storage primitives), `errorRecoveryLogic.js` (pure auto-reload & chunk recovery policies),
  `validationRules.js` (shared schema validation primitives), `srcset.js`, `eventPhotos.js`, `validateContactForm.js`,
  `contactDraft.js`, `validateEvents.js`, `validateTeam.js`, `validateEchoSlides.js`, `keyboardLock.js`,
  `ariaActivation.js`, `aosGating.js` (gate + `initAOS`), `breakpoints.js` (viewports 500/767/768/1024),
  `carouselWrap.js` (shared wrap math), `scrollLock.js` (ref-counted body lock), `navigationCoordinator.js` (unified scroll/overlay/lock coordinator),
  `overlayLifecycle.js` (pure focus/trap/escape helpers), `routePrefetchLogic.js` (pure route loaders),
  `analyticsProbe.js` (pure Vercel-script gate behind DeferredAnalytics),
  `DeferredAnalytics.jsx`, `lazyWithRetry.js`, `sessionCookie.js`, `scrollToSectionLogic.js`, `bootSplashLogic.js`.
- `src/hooks/` — `useLowPower.js` (`useDeviceProfile` driving all perf degradation),
  `useViewportWidth.js` (reactive width over `breakpoints.js`),
  `useCarousel.js` (hand-rolled carousel engine with internal autoplay visibility gating), `useCubeDrag.js` (cube orchestration),
  `useScrollLock.js` (body scroll lock lifecycle), `useEscapeClose.js` (escape key dismissal),
  `useFocusTrap.js` (tab key focus trap), `useFocusRestore.js` (entry focus & next-paint restore),
  `useRoutePrefetch.js` (idle/foresight/intent route chunk prefetch wiring).
- Behavior lives in pure tested modules; components are wiring (ADR-0009) — new logic lands as a
  module with its spec in the same change, and JSX specs use `tests/unit/harness.jsx`.
- `scripts/` — puppeteer probes + Lighthouse perf tests; `scripts/maintenance/` holds the
  CI guards (`check-specs.mjs`, `check-orphan-assets.mjs`, `check-sw-precache.mjs`, `check-prompts.mjs`).
- `tests/*.spec.js` — Playwright E2E suite (split by page/section).
- `public/`, `src/assets/` — static + optimized images.

## §2 Behaviour

### §2.1 Architecture contract (non-negotiable)

One line each — the full contract lives in `CONTRIBUTING.md`:

- **`foces-webv23/` is OFF-LIMITS:** archived Sanity CMS studio, pinned to
  Sanity 3 / React 18 on purpose. Root tooling must never lint/build/format
  it (every tool skips it — `pnpm check:prompts` verifies the exclusions
  agree). Never "upgrade to match the root". See `foces-webv23/README.md`.
- **Performance is a feature.** Never remove the `useDeviceProfile`
  (`slowNetwork`, `lowPower`) guards, and never let gated content disappear
  entirely (AOS safety net in `src/App.css`).
- **PWA precache is app-shell only.** Photos ship via the immutable HTTP
  cache, not the service worker (`vite.config.js`).
- **Images:** responsive `srcset` + `decoding="async"`; lazy-load below the fold.
- **A11y (WCAG 2.1/2.2):** keyboard-accessible with visible focus. Only one
  widget may own arrow keys at a time — coordinate via `src/utils/keyboardLock.js`.
- **Styling:** Tailwind utilities; no inline `style={{}}` for custom visuals.
  Prettier is the single source of truth (single quotes, 100-col, 4-space CSS).
- **No dead code.** Unconsumed field/class/dep goes away, or its "why" is
  recorded in `docs/adr/` (`pnpm knip` enforces).
- **Security:** never commit `.env`, tokens, or the Sanity studio auth.
  EmailJS keys are only referenced via `VITE_*` env vars.
- **Complexity: CRAP < 8.** `CRAP = CC² × (1−coverage)³ + CC`, so at 100%
  coverage CRAP = CC. Agents: hard ceiling CC ≤ 8, ideal ≤ 5. Humans may
  reach 15 only with a justifying ADR. No ESLint gate — review + this file govern.
- **Mutation testing.** IF the change touches pure decision modules
  (`src/utils`, `src/data`, `src/hooks`, `*.js` in `Components`/`Pages` —
  same globs as `stryker.config.mjs`) THEN run it scoped:
  `pnpm exec stryker run --mutate <file>`. Bar: 70% break overall, 80% for
  critical decision modules (review policy — see the config header; ~23%
  equivalent mutants expected). Deliberately not in CI (slow, noisy under
  contention — run on a quiet machine). Agents must not merge below bar;
  humans need an ADR.
- **CodeRabbit enforces strict automated PR reviews** (root `.coderabbit.yaml`
  is the single active config): assertive profile,
  `request_changes_workflow: true`. Address findings before merging; never
  dismiss without reason.

### §2.2 Verify (run before you commit)

`pnpm verify` runs the fast deterministic gate (lint + format check + unit
tests + check:specs/check:assets/check:sw/check:prompts + build + `git diff --check`) in
one command. The individual steps, if you prefer:

```powershell
pnpm lint          # ESLint 10 flat config, no warnings expected
pnpm format:check  # Prettier (writes with pnpm format if dirty)
pnpm knip          # dead-code / unused-dependency guard (CI runs it too — see CONTRIBUTING)
pnpm lint:workflows  # actionlint + shellcheck on .github/workflows/ — required after touching any workflow file
pnpm check:prompts  # prompt-parity guard (configs, ADR pointer, studio exclusions, Map paths, glossary)
pnpm build         # production build must succeed
pnpm test          # Playwright E2E (tests/*.spec.js) — see scoping rubric below
git diff --check   # no whitespace errors
```

Scoping rubric: IF the change is scoped (≤3 files, one section/route) THEN
run the targeted specs (`pnpm test:unit <name>`, `playwright test -g "<area>"`)
ELSE run the full suites. For UI/a11y changes, run the relevant probes in
`scripts/` against `pnpm preview` (per `CONTRIBUTING.md`).

`pnpm lint:workflows` (actionlint + shellcheck) also runs in
the pre-push hook — run it manually anytime you edited `.github/workflows/`
so workflow bugs (and shell-injection in `run:` steps) fail before CI
queues a run.

### §2.3 Push / PR flow (behaviour — format lives in §3)

- **Never push straight to `main`.** Branch protection requires a PR —
  a direct push bypasses CodeRabbit, the PR-time checks, and review entirely.
- **Flow:** `git fetch origin` → branch off an up-to-date `main` →
  commit (§3.1) → push the branch → open a PR with `gh pr create` →
  **wait for every gate** — the four required checks (Lint & Build,
  E2E (Playwright), Probes (structural checks), Validate commit messages),
  CodeQL, and the CodeRabbit review → resolve failures/findings with
  follow-up commits → merge when all green.
- **Dependabot PRs auto-merge** once the four CI checks pass
  (`.github/workflows/auto-merge-dependabot.yml` polls CI, then squash-merges
  and deletes the branch). Everything else merges manually.
- **Review loop (every PR — human-authored or bot).** After CI is green:
  (1) check reviewer input — `gh pr view --json
reviews,comments,reviewDecision` plus inline threads — and request a
  reviewer if none is assigned. (2) Request the manual CodeRabbit review:
  auto-review is skipped for this OSS repo (the `CodeRabbit` check reports
  "Review skipped: manual review required"), so comment `@coderabbitai full
review` on the PR and wait for the review run to finish — never merge
  while it is still running. (3) Address every finding (human or
  CodeRabbit) with follow-up commits (never dismiss without reason), push,
  and wait for the next review round. (4) Repeat until `reviewDecision` is
  APPROVED AND the manual review finished with no unresolved blocking
  findings (non-blocking nits may remain in both) — then merge. Bounded waits only: poll
  `gh pr checks --watch` to green, re-poll ≤2 more times at CI-length
  intervals (~5 min), 1 rerun max for a suspected infra flake — THEN stop
  and report instead of polling forever. Never self-approve your own PR,
  and never merge it without the required approval unless the human
  explicitly instructs the bypass.
- **Agent merges (sebin-gg bypass) — merge only post-CI.** Agents act as
  `sebin-gg`, which is on the PR review bypass list: no approval is needed,
  and `--admin` is never the tool for that. Before merging an agent PR:
  (1) the head branch must contain the latest `main` (fetch + rebase first —
  Renovate/Dependabot land things constantly); (2) `gh pr checks --watch`
  until every required check is green on the final SHA (merging seconds
  after a push fails with "not mergeable"); (3) no unresolved CodeRabbit
  blocking review. Only then `gh pr merge --squash --delete-branch`. If a
  check is red, fix it or stop and report — never bypass. `--admin` is
  reserved for explicit human instruction in the moment. Note: `gh pr merge`
  refuses client-side while `reviewDecision` is `REVIEW_REQUIRED` even for
  bypass-listed users — merge through the REST endpoint instead:
  `gh api repos/<owner>/<repo>/pulls/<n>/merge -X PUT -f merge_method=squash
-f commit_title="..."`, which honors the bypass server-side.
- **The remote moves on its own** (Dependabot, Renovate, other agents push
  daily). Before pushing anything, `git fetch origin` and rebase/merge the
  latest `main`; never force-push. If a push is rejected, fetch + rebase +
  push again.
- **CodeRabbit reviews PRs only** — a commit pushed directly to `main` gets
  no automated review. If a fix was already pushed straight to main, the only
  way to get it reviewed is to re-issue it through a PR.
- **Merge gate:** never merge without CI + CodeQL + CodeRabbit green —
  CodeRabbit's `request_changes_workflow: true` plus its title/description
  checks in `error` mode block the merge until resolved. The manual review
  from the loop above must have finished with no unresolved blocking
  findings (non-blocking nits may remain).

## §3 Output

### §3.1 Commits

- **Conventional Commits only:** `feat|fix|perf|a11y|chore|docs|test|refactor|ci|build|style|revert(scope):`
  (see `commitlint.config.cjs`). Husky enforces it locally; CI re-checks on
  PRs. Bypass (`--no-verify`) ONLY when hooks are broken (hook crashes or
  errors) or an emergency hotfix cannot land otherwise — and state why in
  the PR body. Never a habit.

### §3.2 PRs

- Open against `main` with the `.github/pull_request_template.md` body filled
  in: **How to test** and the **Checklist** are enforced by CodeRabbit's
  description check. Tick only what was actually run.
- Title follows Conventional Commits (~72 chars, lowercase, no trailing
  period) — enforced by CodeRabbit's title check in `error` mode.

### §3.3 Docs / ADR

- IF the change alters a contract, adds/removes a check, changes perf/a11y
  behavior, or overrules a prior ADR THEN record it in `docs/adr/` using the
  template there (status: Accepted / Proposed / Deprecated; one file per
  decision, linked from `docs/adr/README.md`) — ELSE skip (typo-, comment-,
  and docs-only changes need no record).
- Update `README.md` / `CONTRIBUTING.md` when commands, structure, or the
  perf/a11y contract change.
- Never commit generated artifacts: `dist/`, `test-results/`,
  `playwright-report/`, `node_modules/`, `.env`, local scratch
  (`suggestions*.md`, `*.log`).
