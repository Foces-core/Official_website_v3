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
| `mobile-probe.mjs`   | Mobile viewport: nav color, hamburger menu, modal                                                    |
| `firefox-probe.mjs`  | Gecko (Firefox/Waterfox) rendering + CPU throttling                                                  |
| `img-probe.mjs`      | Image asset checks: webp delivery, broken images, font loading                                       |
| `perf-probe.mjs`     | Single-profile Lighthouse-style metrics (LCP, TBT, CLS, transfer size)                               |
| `perf-test.mjs`      | Multi-profile Lighthouse runner (desktop/mobile, 4G/3G/2G, CPU throttling variants)                  |
| `boot-profile.mjs`   | Boot profiler: where JS boot time goes (long-task attribution + V8 CPU profile per chunk)            |

### Running Probes

```bash
# Build and serve the production preview
pnpm build && pnpm preview

# In another terminal, run a probe (uses PREVIEW_URL=http://localhost:4173 by default)
pnpm probe:wcag
pnpm probe:carousel
pnpm probe:mobile
pnpm probe:img
pnpm probe:firefox

# Override the target URL
PREVIEW_URL=https://focess-five.vercel.app pnpm probe:wcag

# Perf (manual lab measurement — see below)
pnpm probe:perf                 # full multi-profile Lighthouse run
PERF_ONLY=mobile-4g pnpm probe:perf
pnpm probe:perf:quick           # single-profile puppeteer metrics
pnpm probe:boot 1               # boot profile at 1x CPU (fast)
pnpm probe:boot 4               # boot profile at 4x CPU (simulates a mid-tier phone)
```

### Browser resolution (portable)

All probes resolve Chrome automatically, in this order:

1. `CHROME_PATH` env var (when set),
2. Playwright's installed Chromium (`~/.cache/ms-playwright/…`),
3. common system install paths.

Firefox is resolved via `FIREFOX_PATH` env var, then system paths
(`firefox-probe.mjs` only). No hardcoded user paths remain — the same scripts
run on any machine and in CI (the `probes` CI job uses Playwright's Chromium).

### Performance probes are MANUAL

`perf-test.mjs`, `perf-probe.mjs`, and `boot-profile.mjs` throttle the CPU
(2x–8x), cold-cache the network, and take multiple samples — under shared CI
CPU contention the numbers are noise, not signal. They are deliberately
**not** wired into CI; run them locally on a quiet machine to compare real
changes:

```bash
pnpm probe:perf            # all profiles (slowest)
PERF_ONLY=mobile-3g pnpm probe:perf   # one profile
pnpm probe:boot 1          # where does boot CPU go? (1x = no throttle)
pnpm probe:boot 4          # same, at 4x CPU (mid-tier phone simulation)
```

`boot-profile.mjs` is an **attribution tool, not a wall-clock one**: its V8
profiler (1ms sampling during load) inflates absolute timings under throttle
— measured ~9s splash removal at 4x profiled vs ~0.9s unprofiled on the same
build. Use its output to answer "which chunk is costing boot CPU?"
(per-chunk eval ms), not "how fast is the page?". For wall-clock numbers use
`perf-test.mjs` / Lighthouse. The boot-behavioral regression it guards
(the carousel sections must not mount/fetch at boot) is enforced in CI by
the E2E spec `tests/carousel-lazy.spec.js`, so no CI wiring is needed here.

### Shared Constants

All probes import from `scripts/probes/constants.mjs`:

```js
import { PREVIEW_URL, DEV_URL, resolveChrome } from './constants.mjs';
```

## Maintenance (`scripts/maintenance/`)

One-off generators and asset preparation scripts. These are **not** part of the regular build pipeline — they're run manually when needed.

| Script                    | Purpose                                                         |
| ------------------------- | --------------------------------------------------------------- |
| `check-orphan-assets.mjs` | Fail CI when a file in `src/assets/` is unreferenced            |
| `check-sw-precache.mjs`   | Fail CI when the built SW precaches forbidden chunks (three.js) |

> **`check-orphan-assets.mjs`** is the repo's guard against dead assets
> (knip only checks code, not `src/assets/`). Run it locally with
> `pnpm check:assets`; CI runs it in the lint-and-build job.
>
> **`check-sw-precache.mjs`** guards the app-shell precache (run with
> `pnpm check:sw` after a build; CI runs it too). It fails if the built
> `dist/sw.js` precaches the lazy three.js hero chunk — `globIgnores` in
> `vite.config.js` excludes it, and this verifies the exclusion held.

### Running Maintenance Scripts

```bash
pnpm check:assets   # after touching src/assets/ or its references
pnpm check:sw       # after a build, to verify the SW precache stayed app-shell only
```

The probes resolve their browser via `CHROME_PATH` / `FIREFOX_PATH` env vars
or system installs (see above).
