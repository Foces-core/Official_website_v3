# FOCES Official Website

Official website for **FOCES** (Foundation of Computer Engineering Students), College of Engineering Chengannur — built with React + Vite.

## Prerequisites — install the tools

New to the stack? Install these once (about 15 minutes), then the
`pnpm` commands below just work. Each tool links its official install page,
its docs, a beginner video, and a readable reference.

- **Git** — for cloning, branching, and PRs.
  [Install](https://git-scm.com/downloads) · [Docs](https://git-scm.com/doc) ·
  🎬 [Official videos](https://git-scm.com/videos) ·
  📖 [Pro Git book (free)](https://git-scm.com/book)
- **Node.js ≥ 22.13** — runs Vite, Vitest, and the build (`.nvmrc` pins
  22.13; pnpm 11 requires it).
  [Install](https://nodejs.org/en/download) ·
  [Windows version manager (nvm-windows)](https://github.com/coreybutler/nvm-windows) ·
  [Learn](https://nodejs.org/en/learn) ·
  🎬 [YouTube search — Node.js for beginners](https://www.youtube.com/results?search_query=node+js+for+beginners)
- **pnpm** — the package manager. This repo uses **pnpm only** (never
  npm/yarn): `pnpm install`, `pnpm dev`, ...
  [Install](https://pnpm.io/installation) · [Docs](https://pnpm.io/) ·
  🎬 [YouTube search — pnpm tutorials](https://www.youtube.com/results?search_query=pnpm+tutorial) ·
  📖 [Why pnpm?](https://pnpm.io/motivation)
- **VS Code** — recommended editor; the repo's settings enable ESLint
  fix-on-save + Prettier format-on-save so your edits are always formatted.
  [Install](https://code.visualstudio.com/download) ·
  [Docs](https://code.visualstudio.com/docs) ·
  🎬 [Official intro videos](https://code.visualstudio.com/docs/getstarted/introvideos)
- **Chrome** — used by the E2E tests and probes (Playwright also installs
  its own Chromium automatically, so this is optional).
  [Install](https://www.google.com/chrome/) ·
  [DevTools docs](https://developer.chrome.com/docs/devtools) ·
  🎬 [YouTube search — Chrome DevTools for beginners](https://www.youtube.com/results?search_query=chrome+devtools+for+beginners)

**Never used React or Vite before?** Do the official [React tutorial](https://react.dev/learn)
and skim the [Vite guide](https://vite.dev/guide/) first, then watch a full
walkthrough: 🎬 [YouTube search — build a React + Vite app from scratch](https://www.youtube.com/results?search_query=vite+react+beginner+tutorial).

## Getting started

```bash
pnpm install
cp .env.example .env   # optional — EmailJS/Sentry vars, see below
pnpm dev
```

Run `pnpm verify` before committing — it runs the whole fast gate (lint,
format check, unit tests, structural checks, build) in one command.

## Tech Stack

- **[React 19](https://react.dev/)** + **[Vite 8](https://vite.dev/)** (SWC plugin)
- **[Tailwind CSS](https://tailwindcss.com/)** for styling
- **[Swiper](https://swiperjs.com/)** carousels (Featuring, event galleries, execom)
- **[Three.js](https://threejs.org/) / [Vanta](https://www.vantajs.com/)** hero background
- **[react-router](https://reactrouter.com/)** for `/events` and `/contact` routes
- **PWA** ([`vite-plugin-pwa`](https://vite-pwa-org.netlify.app/)) with service-worker precaching
- **Perf**: `js.foresight` (intent-based route chunk prefetch), manual chunk
  splitting, responsive `srcset` images, and build-time image optimization
- **[Sentry](https://sentry.io/)** (optional) — error tracking via `@sentry/react` + `@sentry/vite-plugin`;
  see `.env.example` for required env vars (`VITE_SENTRY_DSN`, `SENTRY_ORG`,
  `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`)

## .env

The following environment variables are required for the project to function
correctly. Create a `.env` file in the root directory based on `.env.example`:

| Variable                   | Description                                                       |
| -------------------------- | ----------------------------------------------------------------- |
| `VITE_SENTRY_DSN`          | Sentry DSN for error tracking (optional, set in Vercel dashboard) |
| `VITE_EMAILJS_SERVICE_ID`  | EmailJS service ID for contact form                               |
| `VITE_EMAILJS_TEMPLATE_ID` | EmailJS template ID for contact form                              |
| `VITE_EMAILJS_PUBLIC_KEY`  | EmailJS public key for contact form                               |

See `.env.example` for the full list of available variables and their expected values.

## Scripts

| Command             | Purpose                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm dev`          | Local dev server (HMR, auto-opens the browser)                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `pnpm dev:network`  | Dev server exposed on the LAN (test from your phone)                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `pnpm build`        | Production build to `dist/` (image optimizer + PWA precache)                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `pnpm preview`      | Serve `dist/` locally                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `pnpm lint`         | [ESLint](https://eslint.org/) over all `js`/`jsx` files                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `pnpm format`       | [Prettier](https://prettier.io/) format the whole repo (single quotes, 100-col, 4-space CSS)                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `pnpm verify`       | One-command pre-commit gate: lint + format-check + unit tests + structural checks + build                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `pnpm format:check` | Verify formatting (run by CI)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `pnpm lint:watch`   | ESLint in watch mode (live feedback while editing)                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `pnpm knip`         | [knip](https://knip.dev/) dead-code / unused-dependency guard                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `pnpm clean`        | Remove generated artifacts (`dist`, `test-results`, `playwright-report`)                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `pnpm test`         | [Playwright](https://playwright.dev/) E2E suite (split across `tests/*.spec.js`)                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `pnpm test:unit`    | [Vitest](https://vitest.dev/) unit suite (`tests/unit/` — pure logic + component seams via the shared `harness.jsx`; covers detectProfile, keyboardLock, srcset, events, contact, scroll-to-section, cube physics/easter egg, carousel wrap, session cookies, boot splash, analytics deferral, navbar scrollspy/nav actions, body scroll-lock, blur-image states, cube celebration, team roster, breakpoints). Run a single spec by filename: `pnpm test:unit navSpy` (also works in watch: `pnpm test:unit:watch navSpy`) |
| `pnpm test:e2e:ui`  | Playwright UI mode (interactive debugger)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

## Performance Tooling

`scripts/probes/perf-test.mjs` runs [Lighthouse](https://developer.chrome.com/docs/lighthouse/) across device/network profiles
(`desktop-fast`, `mobile-4g`, `mobile-3g`, `mobile-2g`, CPU-throttled variants).
Run a single profile with `PERF_ONLY=profile node scripts/probes/perf-test.mjs`.

See [scripts/README.md](scripts/README.md) for all available probes and maintenance scripts.

## Performance on low-end devices

The site deliberately degrades on slow networks and low-end hardware (see
`src/hooks/useLowPower.js`):

- **slowNetwork** → the hero WebGL, cube, and grain overlay are skipped, the
  boot splash is bypassed, and below-fold routes/images load lazily
- **lowPower / reducedMotion** → heavy animations (idle cube spin, AOS reveals)
  are disabled; content always stays visible
- **PWA precache is app-shell only** — photos come from the immutable HTTP
  cache, so first visits don't download the whole site

## Accessibility (WCAG 2.1/2.2 + ARIA APG)

Every PR runs an automated [axe](https://www.deque.com/axe/) WCAG 2.1/2.2
scan on `/`, `/events`, and `/contact` (in `tests/accessibility.spec.js`),
failing on serious/critical violations — on top of these hand-checked
behaviors:

- Skip-to-content link on every route targets `#main-content`
- Roving `tabindex` on navbar links (arrow keys cycle, exactly one tab stop)
- Focus-trap modal for event photo galleries: focus moves to close button on
  open, `Tab`/`Shift+Tab` stay inside, focus restores to the trigger, `Esc` closes
- `:focus-visible` cyan ring + corner-bracket outline on nav links
- Keyboard navigation on the Featuring carousel and About cube

## Verification Probes

- `scripts/wcag-probe.mjs` — puppeteer checks for skip link, roving tabindex,
  modal focus trap/restore, navbar theme, no console errors
- `scripts/mobile-probe.mjs` — mobile viewport nav/modal/cursor checks
- `scripts/carousel-probe.mjs` — Featuring/Modal carousel arrows, infinite
  loop, hover glow, register-button absence checks
- `scripts/img-probe.mjs` — image asset checks
- `scripts/firefox-probe.mjs` — Gecko (Firefox/Waterfox) rendering check

Probes expect a local preview server (e.g. `pnpm preview`). All probes read
the URL from `PREVIEW_URL` (default `http://localhost:4173`) via the shared
`scripts/probes/constants.mjs` module.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) — setup, branch naming, Conventional
Commits, PR workflow, and the performance/a11y expectations every change must
meet.

**Architecture decisions** live in [docs/adr/](docs/adr/) — touch-gesture
ownership (0007), automatic chunk-load recovery (0008), and the pure-logic
test seams (0009) are the recent ones.

**Automation in this repo:**

- **CI** (`.github/workflows/ci.yml`) — lint + format-check + build + Playwright E2E on every push/PR to `main`
- **Dependabot** (`.github/dependabot.yml`) — weekly grouped dependency PRs
- **CodeRabbit** (`.coderabbit.yaml`) — AI code review on every PR (read-only: comments/summaries only, can't block merges)
- **Dependabot auto-merge** (`.github/workflows/auto-merge-dependabot.yml`) — dependabot PRs squash-merge themselves once CI passes
- **Stale bot** (`.github/workflows/stale.yml`) — closes abandoned issues/PRs
- **Deploys** — handled by the **native Vercel Git integration**: auto
  production deploy on every push to `main`, auto preview deploy on every PR
- **Security** — report vulnerabilities via [SECURITY.md](SECURITY.md)

## Deployment

Hosted on **Vercel** (`focess-five.vercel.app`). All static assets are served
from the Vercel edge CDN same-origin; the service worker precaches them. An
external CDN is intentionally **not** used — it would add cross-origin
connection cost without benefit.
