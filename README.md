# FOCES Official Website

Official website for **FOCES** (Foundation of Computer Engineering Students), College of Engineering Chengannur — built with React + Vite.

## Tech Stack

- **React 18** + **Vite 5** (SWC plugin)
- **Tailwind CSS** for styling
- **Swiper** carousels (Featuring, event galleries, execom)
- **Three.js / Vanta** hero background
- **react-router-dom** for `/events` and `/contact` routes
- **PWA** (`vite-plugin-pwa`) with service-worker precaching
- **Perf**: `js.foresight` (intent-based route chunk prefetch), manual chunk
  splitting, responsive `srcset` images, and build-time image optimization

## Scripts

| Command             | Purpose                                                              |
| ------------------- | -------------------------------------------------------------------- |
| `pnpm dev`          | Local dev server (HMR, auto-opens the browser)                       |
| `pnpm dev:network`  | Dev server exposed on the LAN (test from your phone)                 |
| `pnpm build`        | Production build to `dist/` (image optimizer + PWA precache)         |
| `pnpm preview`      | Serve `dist/` locally                                                |
| `pnpm lint`         | ESLint over all `js`/`jsx` files                                     |
| `pnpm format`       | Prettier format the whole repo (single quotes, 100-col, 4-space CSS) |
| `pnpm format:check` | Verify formatting (run by CI)                                        |

## Performance Tooling

`scripts/perf-test.mjs` runs Lighthouse across device/network profiles
(`desktop-fast`, `mobile-4g`, `mobile-3g`, `mobile-2g`, CPU-throttled variants).
Results are stored in `.perf-report.json`. Run a single profile with
`PERF_ONLY=profile node scripts/perf-test.mjs`.

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

Probes expect a local preview server (e.g. `pnpm preview`); the URL is a
constant at the top of each script.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) — setup, branch naming, Conventional
Commits, PR workflow, and the performance/a11y expectations every change must
meet.

**Automation in this repo:**

- **CI** (`.github/workflows/ci.yml`) — lint + build on every push/PR to `main`
- **Dependabot** (`.github/dependabot.yml`) — weekly grouped dependency PRs
- **CodeRabbit** (`.coderabbit.yaml`) — AI code review on every PR
- **Stale bot** (`.github/workflows/stale.yml`) — closes abandoned issues/PRs
- **Deploys** — handled by the **native Vercel Git integration**: auto
  production deploy on every push to `main`, auto preview deploy on every PR
- **Security** — report vulnerabilities via [SECURITY.md](SECURITY.md)

## Deployment

Hosted on **Vercel** (`focess-five.vercel.app`). All static assets are served
from the Vercel edge CDN same-origin; the service worker precaches them. An
external CDN is intentionally **not** used — it would add cross-origin
connection cost without benefit.
