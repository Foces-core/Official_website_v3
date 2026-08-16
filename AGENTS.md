# 🤖 Agent Instructions — FOCES Official Website

Behavioral rules for AI agents (and humans) working in this repository.
Read this before touching anything.

## 🛑 Critical Rules

- **Live Production URL:** [https://focess-five.vercel.app/](https://focess-five.vercel.app/) — deployed continuously from `main` via Vercel edge.
- **Read first:** architecture/decisions live in `docs/adr/` and the
  performance/a11y contract is in `CONTRIBUTING.md`. Do not duplicate those —
  reference them.
- **Conventional Commits only:** `feat|fix|perf|a11y|chore|docs|test|refactor|ci|build|style|revert(scope):`
  (see `commitlint.config.cjs`). Husky enforces it locally; CI re-checks on
  PRs. Don't use `--no-verify` unless it's genuinely broken.
- **`foces-webv23/` is OFF-LIMITS:** it is the archived Sanity CMS studio from
  the previous site generation. Root tooling must never lint/build/format it.
  Every tool skips it: ESLint flat-config `ignores`, `.prettierignore`, knip
  `ignore`, Dependabot `exclude-paths`, CodeRabbit `path_filters`, and
  `lint-staged.config.js` (filters it out of pre-commit tasks). Do not
  "upgrade to match the root" (it's pinned to Sanity 3 / React 18 on
  purpose). See `foces-webv23/README.md`.
- **Package managers:** root uses **pnpm** (`pnpm install`, `pnpm test`, ...).
  The studio uses **yarn** (inside `foces-webv23/` only). Do not mix.
  Use `sfw` for networked package/tool commands when available.
- **Security:** never commit `.env`, tokens, or the Sanity studio auth.
  EmailJS keys are only referenced via `VITE_*` env vars.
- **Dependabot PRs auto-merge** once the four CI checks pass
  (`.github/workflows/auto-merge-dependabot.yml` polls CI, then squash-merges
  and deletes the branch). Everything else merges manually.
- **CodeRabbit enforces strict automated PR reviews** (`.coderabbit.yaml`):
  Runs automatically on all PRs with assertive review posture and
  `request_changes_workflow: true`. Critical/error findings formally block
  merges until resolved. Address its findings before merging; do not dismiss
  them without reason.

## Map

- `src/App.jsx` — landing page composition (home, about, featuring, events, execom); every lazy
  chunk here loads via `lazyWithRetry` (ADR-0008); cross-route anchor scroll
  decisions come from `scrollToSectionLogic`.
- `src/main.jsx` — router (`/`, `/events`, `/contact`), lazy routes, boot splash (decisions in
  `bootSplashLogic`), StrictMode.
- `src/Pages/` — route-level pages (`LandingPages/`, `EventPage/`).
- `src/Components/` — shared UI (AboutUs, BlurImage, ContactUs, Execom, Grain, InstallPrompt,
  Loader, ScrollGate, SectionSkeleton).
- `src/Components/AboutUs/` — the cube: `easterEggLogic.js` (spin tracker + `SPIN_BARS`),
  `cubePhysics.js` (wind-down), `cubeTiming.js` (timing windows +
  `isManualOverrideActive`), `confettiSim.js` (particles), `easterEggCelebration.js`
  (toast/message/EMA policies) — pure modules, the JSX is wiring. The motion
  orchestration (drag/wind-down/snap, spin tracking, arrow keys) is `useCubeDrag`.
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
  `DeferredAnalytics.jsx`, `lazyWithRetry.js`, `sessionCookie.js`, `scrollToSectionLogic.js`, `bootSplashLogic.js`.
- `src/hooks/` — `useLowPower.js` (`useDeviceProfile` driving all perf degradation),
  `useViewportWidth.js` (reactive width over `breakpoints.js`),
  `useAutoplayOnScreen.js` (on-screen autoplay gate), `useCubeDrag.js` (cube orchestration),
  `useScrollLock.js` (body scroll lock lifecycle), `useEscapeClose.js` (escape key dismissal),
  `useFocusTrap.js` (tab key focus trap), `useFocusRestore.js` (entry focus & next-paint restore),
  `useRoutePrefetch.js` (idle/foresight/intent route chunk prefetch wiring).
- Behavior lives in pure tested modules; components are wiring (ADR-0009) — new logic lands as a
  module with its spec in the same change, and JSX specs use `tests/unit/harness.jsx`.
- `scripts/` — puppeteer probes + Lighthouse perf tests; `scripts/maintenance/` holds the
  CI guards (`check-specs.mjs`, `check-orphan-assets.mjs`, `check-sw-precache.mjs`).
- `tests/*.spec.js` — Playwright E2E suite (split by page/section).
- `public/`, `src/assets/` — static + optimized images.

## Architecture contract (non-negotiable)

- **Performance is a feature.** The site deliberately degrades on slow/low-end
  devices via the `useDeviceProfile` hook in `src/hooks/useLowPower.js`
  (`slowNetwork`, `lowPower`). Never remove
  those guards, and never let gated content disappear entirely (see the AOS
  safety net in `App.css`).
- **PWA precache is app-shell only.** Photos ship via the immutable HTTP
  cache, not the service worker — keep it that way (`vite.config.js`).
- **Images:** responsive `srcset` variants + `decoding="async"`; lazy-load
  below the fold. Build-time optimization handles the rest.
- **A11y (WCAG 2.1/2.2):** keyboard-accessible with visible focus. Only one
  widget may respond to arrow keys at a time — coordinate via
  `src/utils/keyboardLock.js`.
- **Styling:** Tailwind utility classes are the norm; no inline
  `style={{}}` for custom visuals. Prettier is the single source of truth
  (single quotes, 100-col, 4-space CSS).
- **No dead code.** If a field/class/dep isn't consumed, remove it or explain
  why it stays (see `docs/adr/` for how to record the "why").

## Verify (run before you commit)

`pnpm verify` runs the fast deterministic gate (lint + format check + unit
tests + check:specs/check:assets/check:sw + build + `git diff --check`) in
one command. The individual steps, if you prefer:

```powershell
pnpm lint          # ESLint 10 flat config, no warnings expected
pnpm format:check  # Prettier (writes with pnpm format if dirty)
pnpm knip          # dead-code / unused-dependency guard (CI runs it too — see CONTRIBUTING)
pnpm lint:workflows  # actionlint + shellcheck on .github/workflows/ — required after touching any workflow file
pnpm build         # production build must succeed
pnpm test          # Playwright E2E (tests/*.spec.js) — run targeted tests when scoping
git diff --check   # no whitespace errors
```

`pnpm lint:workflows` (actionlint + shellcheck, added in #86) also runs in
the pre-push hook — run it manually anytime you edited `.github/workflows/`
so workflow bugs (and shell-injection in `run:` steps) fail before CI
queues a run.

For UI/a11y changes, run the relevant probes in `scripts/` against
`pnpm preview` (per `CONTRIBUTING.md`).

## Docs / ADR

- Any meaningful architecture decision → add a record in `docs/adr/` using the
  template there (status: Accepted / Proposed / Deprecated). One file per
  decision, linked from `docs/adr/README.md`.
- Update `README.md` / `CONTRIBUTING.md` when commands, structure, or the
  perf/a11y contract change.
- Never commit generated artifacts: `dist/`, `test-results/`,
  `playwright-report/`, `node_modules/`, `.env`, local scratch
  (`suggestions*.md`, `*.log`).
