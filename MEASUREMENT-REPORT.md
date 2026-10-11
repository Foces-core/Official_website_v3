# FOCES Website v3 — Local Performance & UX Measurement Report

**Date:** 2026-10-10 · **Target:** production `dist/` build (Oct 9, 21:55) served locally at `http://127.0.0.1:5174`

All numbers from the repo's own probes: `scripts/probes/` (see `scripts/README.md`).

---

## 1. Lighthouse multi-profile matrix (`pnpm probe:perf` → `scripts/.perf-report.json`)

| Profile                  | Perf score | FCP       | LCP       | TBT      | CLS  | Transfer |
| ------------------------ | ---------- | --------- | --------- | -------- | ---- | -------- |
| desktop-fast             | 97         | 830 ms    | 1,133 ms  | 0 ms     | 0.00 | 879 KB   |
| mobile-4g                | 74         | 3,007 ms  | 5,335 ms  | 69 ms    | 0.00 | 861 KB   |
| mobile-4g-reduced-motion | 71         | 3,831 ms  | 5,332 ms  | 57 ms    | 0.00 | 861 KB   |
| mobile-3g                | 57         | 8,106 ms  | 10,807 ms | 84 ms    | 0.00 | 862 KB   |
| mobile-2g                | 54         | 22,849 ms | 32,814 ms | 96 ms    | 0.00 | 862 KB   |
| mobile-cpu6x             | 69         | 3,761 ms  | 5,186 ms  | 191 ms   | 0.00 | 861 KB   |
| mobile-cpu7x             | 72         | 3,006 ms  | 5,334 ms  | 168 ms   | 0.00 | 861 KB   |
| mobile-cpu20x            | 49         | 3,907 ms  | 5,333 ms  | 1,006 ms | 0.00 | 861 KB   |

**A11y 100/100 and Best Practices 100/100 on every profile.**

Top recurring "what's wrong" item: **Reduce unused JavaScript (~1.3 s on 4G, ~7.2 s on 2G)** — the lazy chunks that Lighthouse loads when it scrolls. CLS is a perfect 0.00 across all profiles.

---

## 2. Boot CPU attribution (`pnpm probe:boot` → `.boot-1x.json` / `.boot-4x.json`)

| Throttle            | Total boot CPU | FCP    | Splash gone | TBT    | Long tasks |
| ------------------- | -------------- | ------ | ----------- | ------ | ---------- |
| 1x (desktop)        | 5,583 ms       | 272 ms | 1,372 ms    | 2 ms   | 1          |
| 4x (mid-tier phone) | 13,297 ms      | 256 ms | 8,690 ms    | 395 ms | 4          |

Per-chunk CPU (4x): `esm-*.js` 424 ms > `react-vendor` 290 ms > `index.js` 54 ms.
Note (per scripts/README.md): boot-profile timings are inflated by the V8 sampler under throttle — use them for _attribution_ (which chunk costs what), not wall-clock.

Wall-clock boot story: FCP is ~0.27 s even at 4x, but the boot splash lingers ~8.7 s on a throttled mid-tier phone before the app entrains.

---

## 3. Accessibility

### wcag-probe (behavioral, 19 checks): 19 passed, 0 failed

Skip link, roving tabindex, arrow-key nav, modal focus trap/restore/Escape, nav theming, sr-only h1, zero console errors.

### axe-core WCAG scan (`scripts/probes/axe-adhoc.mjs`, tags wcag2a/2aa/21a/21aa/22aa):

- `/` — 0 violations
- `/events` — 0 violations
- `/contact` — 0 violations
  **All routes clean — no serious/critical WCAG violations.** (Matches the Lighthouse A11y 100/100.)

---

## 4. Mobile UX (`pnpm probe:mobile`)

- Nav color on /events: correct (`nav-w`), hamburger menu visible/functional
- Menu link color + translucent menu background OK
- Modal: present, focus lands inside — OK
- Hamburger toggle visible — OK

## 5. Carousel / Featuring behavior (`pnpm probe:carousel`)

- 12 slides, arrows work, **wraps infinitely** (verified by 6-click cycle), hover glow/ring present
- Images lazy-load (no "Register Now" leak in carousel), modal opens with counter
- Result: PASS (no structural issues)

## 6. Images (`pnpm probe:img`)

- 2 WebP images served, 0 broken, fonts loaded, feature slides + event images OK

## 7. Boot errors (`pnpm probe:boot-errors`)

- App paints (root has children), splash removed, hero text visible
- Only "error" recorded: Sentry ingest endpoint unreachable from the sandboxed probe browser (offline network quarantine) — not a product defect.

---

## 8. Firefox (`pnpm probe:firefox`) — could not run

Playwright's Firefox binary exists but fails to launch under this sandbox (Code 0). Needs a manual run on this machine outside the agent sandbox: `FIREFOX_PATH="C:\Program Files\Mozilla Firefox\firefox.exe" pnpm probe:firefox`.

---

## Watch-list (who to fix first if scores regress)

1. **Reduce unused JS** (~1.3–7.2 s potential savings on mobile profiles) — biggest single Lighthouse lever.
2. **Splash removal time** on throttled CPUs (8.7 s at 4x) — visible as "boot feels slow on phones" even though FCP is fast.
3. **2G profile** — perf 54 with LCP 32.8 s; acceptable if 2G users are rare, but the first paint is dominated by network transfer there (~862 KB).

## How to re-run everything

```bash
node scripts/static-server.mjs            # serve dist/ on :5174 in one terminal
pnpm probe:perf                            # Lighthouse matrix
pnpm probe:perf:quick                      # fast single-profile
pnpm probe:boot 1 / pnpm probe:boot 4      # boot CPU attribution
pnpm probe:wcag / probe:mobile / probe:carousel / probe:img / probe:boot-errors
node scripts/probes/axe-adhoc.mjs          # raw axe WCAG scan (needs CHROME_PATH)
pnpm test tests/accessibility.spec.js      # Playwright axe E2E (needs pnpm test:install first)
```
