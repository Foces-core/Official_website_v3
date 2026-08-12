# Scripts

This directory contains utility scripts organized by purpose.

## Structure

```
scripts/
├── probes/          # Verification probes (run against preview/dev servers)
└── maintenance/     # One-off asset generators and build helpers
```

## Probes (`scripts/probes/`)

Verification scripts that run against a live server (preview or dev). All probes read `PREVIEW_URL` from the environment (default: `http://localhost:4173`).

| Script               | Purpose                                                                                              |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| `carousel-probe.mjs` | Featuring & Events modal carousel: arrows, infinite loop, hover glow, no "Register Now"              |
| `wcag-probe.mjs`     | WCAG/ARIA checks: skip link, roving tabindex, modal focus trap/restore, navbar theme, console errors |
| `mobile-probe.mjs`   | Mobile viewport: nav color, hamburger menu, modal, cursor blob tracking                              |
| `firefox-probe.mjs`  | Gecko (Firefox/Waterfox) rendering + CPU throttling                                                  |
| `img-probe.mjs`      | Image asset checks: webp delivery, broken images, font loading                                       |
| `perf-probe.mjs`     | Single-profile Lighthouse-style metrics (LCP, TBT, CLS, transfer size)                               |
| `perf-test.mjs`      | Multi-profile Lighthouse runner (desktop/mobile, 4G/3G/2G, CPU throttling variants)                  |

### Running Probes

```bash
# Build and serve the production preview
pnpm build && pnpm preview

# In another terminal, run a probe (uses PREVIEW_URL=http://localhost:4173 by default)
node scripts/probes/wcag-probe.mjs
node scripts/probes/carousel-probe.mjs
node scripts/probes/mobile-probe.mjs
node scripts/probes/firefox-probe.mjs
node scripts/probes/img-probe.mjs

# Override the target URL
PREVIEW_URL=https://focess-five.vercel.app node scripts/probes/wcag-probe.mjs

# Run perf test against a specific URL
node scripts/probes/perf-test.mjs https://focess-five.vercel.app/
# Or run a single profile
PERF_ONLY=mobile-4g node scripts/probes/perf-test.mjs
```

### Shared Constants

All probes import from `scripts/probes/constants.mjs`:

```js
import { PREVIEW_URL, DEV_URL } from './constants.mjs';
```

## Maintenance (`scripts/maintenance/`)

One-off generators and asset preparation scripts. These are **not** part of the regular build pipeline — they're run manually when needed.

| Script                                 | Purpose                                         |
| -------------------------------------- | ----------------------------------------------- |
| `create-assets.cjs`                    | Generate optimized assets from source           |
| `create-og.cjs` / `create-og-full.cjs` | Generate Open Graph images                      |
| `generate-og-image.mjs`                | Generate OG image for social sharing            |
| `generate-public-assets.mjs`           | Generate public assets                          |
| `prepare-event-assets.mjs`             | Prepare event images (resize, optimize, srcset) |
| `prepare-new-found-media.mjs`          | Process newly found media assets                |
| `prepare-winners-asset.mjs`            | Prepare winner showcase assets                  |
| `extract-frames.mjs`                   | Extract frames from video                       |
| `empty.js`                             | Placeholder                                     |

### Running Maintenance Scripts

```bash
# Example: prepare event assets after adding new event images
node scripts/maintenance/prepare-event-assets.mjs
```

These scripts use local Chromium paths and are environment-specific. Adjust paths as needed.
