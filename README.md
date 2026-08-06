# FOCES Official Website

Official website for **FOCES** (Foundation of Computer Engineering Students), College of Engineering Chengannur — built with React + Vite.

## Tech Stack

- **React 18** + **Vite 5** (SWC plugin)
- **Tailwind CSS** for styling
- **Swiper** carousels (Featuring, event galleries, execom)
- **Three.js / Vanta** hero background
- **react-router-dom** for `/events` and `/contact` routes
- **@sanity/block-content-to-react** for event descriptions
- **PWA** (`vite-plugin-pwa`) with service-worker precaching
- **Perf**: `quicklink` (viewport route prefetch) + `js.foresight` (intent-based route chunk prefetch)

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Local dev server (HMR) |
| `pnpm build` | Production build to `dist/` (image optimizer + PWA precache) |
| `pnpm preview` | Serve `dist/` locally |
| `pnpm lint` | ESLint over all `js`/`jsx` files |

## Performance Tooling

`scripts/perf-test.mjs` runs Lighthouse across device/network profiles
(`desktop-fast`, `mobile-4g`, `mobile-3g`, `mobile-2g`, CPU-throttled variants).
Results are stored in `.perf-report.json`. Run a single profile with
`PERF_ONLY=profile node scripts/perf-test.mjs`.

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
- `scripts/img-probe.mjs` — image asset checks
- `scripts/firefox-probe.mjs` — Gecko (Firefox/Waterfox) rendering check

Probes expect a local preview server (e.g. `pnpm preview`); the URL is a
constant at the top of each script.

## Deployment

Hosted on **Vercel** (`focess-five.vercel.app`). All static assets are served
from the Vercel edge CDN same-origin; the service worker precaches them. An
external CDN is intentionally **not** used — it would add cross-origin
connection cost without benefit.
