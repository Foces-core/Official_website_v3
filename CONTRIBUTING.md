# Contributing to the FOCES website

Thanks for helping keep this project alive — FOCES is built by students, for
students, and the website is meant to outlast any single batch. These
guidelines keep the codebase healthy so the next team can pick it up in a
decade and still feel at home.

## Development setup

Prerequisites: **Node ≥ 18** and **pnpm** (version pinned in `package.json`
via `packageManager`).

```sh
pnpm install
pnpm dev        # local dev server at http://localhost:5173
pnpm lint       # ESLint over all js/jsx
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
   subject, body only when it explains *why*.
3. Open a pull request against `main`. CI (lint + build) must pass, and
   CodeRabbit will review it automatically. Request a human review from a
   core member too.

## Code expectations

- **React + Tailwind**: keep components small and focused. Tailwind utility
  classes are the norm; use dedicated CSS files (not inline `style={{}}`)
  for anything custom.
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
- For UI changes, verify desktop + mobile viewports.
- The repo has puppeteer **probes** in `scripts/` (`wcag-probe.mjs`,
  `mobile-probe.mjs`, `carousel-probe.mjs`, `img-probe.mjs`,
  `firefox-probe.mjs`) — run them against `pnpm preview` when you touch
  navigation, modals, carousels, or a11y.

## Automation you can rely on

- **Dependabot** opens dependency PRs weekly (grouped by area).
- **CI** (`.github/workflows/ci.yml`) lints + builds every push/PR.
- **CodeRabbit** reviews every PR.
- A **stale bot** closes abandoned issues/PRs so the backlog stays clean.

## Questions?

Open a discussion or an issue — there are no dumb questions, only unasked ones.
