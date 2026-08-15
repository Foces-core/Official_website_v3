# Contributing to the FOCES website

Thanks for helping keep this project alive — FOCES is built by students, for
students, and the website is meant to outlast any single batch. These
guidelines keep the codebase healthy so the next team can pick it up in a
decade and still feel at home.

## Development setup

Prerequisites: **Node ≥ 22.13** (pnpm 11.x requires it) and **pnpm** (version
pinned in `package.json` via `packageManager`).

```sh
pnpm install
pnpm dev        # local dev server at http://localhost:5173
pnpm lint       # ESLint over all js/jsx
pnpm format     # one-time Prettier format of the whole repo
pnpm format:check  # CI-only: verify formatting without writing
pnpm build      # production build (image optimizer + PWA precache)
```

## Making changes

1. Create a branch off `main` with a descriptive prefix:
   - `feat/` — new feature (e.g. `feat/cube-easter-egg`)
   - `fix/` — bug fix (e.g. `fix/mobile-nav-overlay`)
   - `perf/` — performance / bandwidth work (e.g. `perf/responsive-images`)
   - `a11y/` — accessibility work (e.g. `a11y/modal-focus-trap`)
   - `chore/` or `docs/` — maintenance, tooling, docs
2. Make small, focused commits. We follow **Conventional Commits**:
   `feat:`, `fix:`, `perf:`, `a11y:`, `chore:`, `docs:` prefixes, ~50-char
   subject, body only when it explains _why_. **Husky hooks enforce this**
   locally: `lint-staged` lints _and formats_ your staged files (ESLint
   `--fix` + Prettier) before every commit, and `commitlint` validates the
   message (`a11y:` is allowed). CI runs the same commitlint check on every
   PR. Emergency bypass: `git commit --no-verify` (don't make it a habit).
3. Open a pull request against `main`. CI (lint + build + E2E) must pass, and
   CodeRabbit will review it automatically. Request a human review from a
   core member too.
4. If your change makes a meaningful architecture decision, record it in
   `docs/adr/` (see the index + template there).

## Code expectations

- **React + Tailwind**: keep components small and focused. Tailwind utility
  classes are the norm; use dedicated CSS files (not inline `style={{}}`)
  for anything custom.
- **Formatting**: Prettier (`.prettierrc.json`) is the single source of
  truth — single quotes, 100-char width, 4-space CSS. Run `pnpm format`
  after a big change; the pre-commit hook formats your staged files
  automatically. If you must override, use an inline `// prettier-ignore`
  (rare).
- **Performance is a feature**: this site deliberately degrades on slow
  networks and low-end devices via `useDeviceProfile` (`slowNetwork`,
  `lowPower`, `lowCPU`). Never remove those guards, and test that gated
  content still appears (it must — see the AOS safety net in `App.css`).
- **Accessibility (WCAG 2.1/2.2)**: interactive elements must be
  keyboard-accessible with visible focus styling. When only one widget may
  respond to arrow keys, coordinate via the shared keyboard lock
  (`src/utils/keyboardLock.js`) — don't add competing global listeners.
- **Images**: ship responsive `srcset` variants and lazy-load below the
  fold. The build optimizes every asset automatically.
- **No dead code**: if a field, class, or dependency isn't consumed,
  remove it (or ask why it's still there).

## Testing

- `pnpm lint` and `pnpm build` before every PR.
- `pnpm test` runs the Playwright E2E suite, split across `tests/*.spec.js`
  by page/section so failing scenarios run in isolation. Run targeted tests
  when your change is scoped: `pnpm exec playwright test -g "Carousel"` or
  `pnpm exec playwright test tests/contact.spec.js`.
- `pnpm test:unit` runs the fast Vitest suite in `tests/unit/` (jsdom):
  device-profile heuristics, `keyboardLock` arrow-key arbitration, `srcset`,
  events/contact validation, and the pure decision modules behind the
  components (cube physics + easter egg, carousel wrap, scroll-to-section,
  session cookies, boot splash, analytics deferral). JSX specs render
  through the shared `tests/unit/harness.jsx`. CI runs it in the
  lint-and-build job; E2E never imports it. Behavior lives in pure tested
  modules — see [ADR-0009](docs/adr/0009-pure-logic-test-seams.md).
- For UI changes, verify desktop + mobile viewports.
- The repo has puppeteer **probes** in `scripts/probes/` (`wcag-probe.mjs`,
  `mobile-probe.mjs`, `carousel-probe.mjs`, `img-probe.mjs`,
  `firefox-probe.mjs`, `perf-probe.mjs`, `perf-test.mjs`,
  `boot-profile.mjs`) — run them against `pnpm preview` when you touch
  navigation, modals, carousels, a11y, or boot performance. The fast
  structural probes (`probe:wcag`, `probe:carousel`, `probe:mobile`) run in
  CI; the perf probes (`probe:perf`, `probe:perf:quick`, `probe:boot`) are
  lab measurements (CPU throttling makes them noisy under CI contention —
  `boot-profile` in particular is an attribution tool whose profiler
  inflates absolute timings). The nightly Lighthouse run
  (`.github/workflows/perf-nightly.yml`) enforces generous budgets
  (`scripts/maintenance/check-perf-budgets.mjs`) and opens a regression
  issue when they're breached. Chrome/Firefox are resolved portably via
  `CHROME_PATH`/`FIREFOX_PATH` or the installed Playwright browser. See
  [scripts/README.md](scripts/README.md) for details.

## Automation you can rely on

- **Dependabot** opens dependency PRs weekly (grouped by area) and they
  auto-merge once the four CI checks pass (`.github/workflows/auto-merge-dependabot.yml`).
- **CI** (`.github/workflows/ci.yml`) lints + builds every push/PR, and its
  **notify-on-failure** job comments on a PR the moment any check turns red
  (GitHub emails PR participants, so the author is pinged — the same
  channel CodeRabbit review comments use).
- **CodeRabbit** reviews every PR in read-only mode (comments/summaries only —
  it can't formally block merges; see `.coderabbit.yaml` header).
- A **stale bot** closes abandoned issues/PRs so the backlog stays clean.
- The **nightly perf run** (`.github/workflows/perf-nightly.yml`) audits
  Lighthouse across eight profiles; a budget breach opens a regression
  issue @mentioning the last committer on `main`, and the next green run
  closes it.

### Merge gate

Merges should only happen when every CI check is green — that's what the
Dependabot auto-merge workflow already enforces for bots. For human PRs it
is enforced by **branch protection** in the repo settings (not in-repo):
require the `Lint & Build`, `E2E (Playwright)`, `Probes (structural checks)`
and `Validate commit messages` status checks before merge, plus the perf
nightly so it never blocks a PR on timing jitter. With that in place the
flow is: push freely → CI/CodeRabbit comment on anything wrong → merge only
when the checks are green.

## Questions?

Open a discussion or an issue — there are no dumb questions, only unasked ones.
