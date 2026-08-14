# 🤖 Agent Instructions — FOCES Official Website

Behavioral rules for AI agents (and humans) working in this repository.
Read this before touching anything.

## 🛑 Critical Rules

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
- **CodeRabbit reviews every PR** (`.coderabbit.yaml`). Wait for its review to
  finish and address blocking comments before merging. Do not merge while a
  CodeRabbit review is pending, and do not dismiss its findings without
  reason.

## Map

- `src/App.jsx` — landing page composition (home, about, featuring, events, execom); every lazy
  chunk here loads via `lazyWithRetry` (ADR-0008); cross-route anchor scroll
  decisions come from `scrollToSectionLogic`.
- `src/main.jsx` — router (`/`, `/events`, `/contact`), lazy routes, boot splash (decisions in
  `bootSplashLogic`), StrictMode.
- `src/Pages/` — route-level pages (`LandingPages/`, `EventPage/`).
- `src/Components/` — shared UI (AboutUs, ContactUs, Execom, Grain, InstallPrompt, Loader,
  ScrollGate, SectionSkeleton).
- `src/Components/AboutUs/` — the cube: `easterEggLogic.js` (spin tracker + `SPIN_BARS`),
  `cubePhysics.js` (wind-down), `confettiSim.js` (particles) — pure modules, the JSX is wiring.
- `src/Components/Execom/` — team carousel: `TeamCarousel.jsx` + pure `carouselWrap.js`.
- `src/data/events.js` — **single source of truth** for events (home section + `/events` share it).
- `src/utils/` — helpers: `srcset.js`, `eventPhotos.js`, `validateContactForm.js`,
  `validateEvents.js`, `keyboardLock.js`, `aosGating.js` (gate + `initAOS`),
  `DeferredAnalytics.jsx`, `lazyWithRetry.js`, `sessionCookie.js`, `scrollToSectionLogic.js`,
  `bootSplashLogic.js`.
- `src/hooks/useLowPower.js` — exports the `useDeviceProfile` hook driving all perf degradation.
- Behavior lives in pure tested modules; components are wiring (ADR-0009) — new logic lands as a
  module with its spec in the same change, and JSX specs use `tests/unit/harness.jsx`.
- `scripts/` — puppeteer probes + Lighthouse perf tests.
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

```powershell
pnpm lint          # ESLint 10 flat config, no warnings expected
pnpm format:check  # Prettier (writes with pnpm format if dirty)
pnpm build         # production build must succeed
pnpm test          # Playwright E2E (tests/*.spec.js) — run targeted tests when scoping
git diff --check   # no whitespace errors
```

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
