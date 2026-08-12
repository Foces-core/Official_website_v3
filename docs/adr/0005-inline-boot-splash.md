# 0005 — Static inline boot splash for near-instant first paint

Status: Accepted
Date: 2026-08-12

## Context

Field data (CrUX) reported a P75 First Contentful Paint of ~2s. The site is a
client-rendered SPA: `index.html` shipped an empty `<div id="root">`, and even
the branded boot loader was painted by React. So no pixel could appear until
the full JS critical path — the entry bundle, `react-vendor` (~231 KB), and the
render-blocking Tailwind stylesheet (~77 KB) — had downloaded, parsed, and
executed. FCP was equal to JS boot time, not to content load.

## Decision

Move the boot splash out of React and into the document. `index.html` now
contains a static `#boot-splash` (logo + "Loading...") with ~600 B of inline
critical CSS, painted by the browser on HTML parse — before JS finishes booting.
`Root` in `src/main.jsx` no longer renders a loader; it only fades the element
out (`is-fading`) once fonts + first paint land (or `window.load`, or a 5s
failsafe) and removes it. Slow/low-end devices (per `useDeviceProfile`) skip
it entirely, preserving ADR-0001. The `Loader` component stays as the
lazy-route Suspense fallback.

## Consequences

- Positive: first paint no longer waits on the JS bundle; FCP is essentially
  HTML-parse time. Removed the fixed 2.5s branding delay, so content appears
  faster while keeping a smooth fade.
- Negative / trade-offs: the inline splash is a second, hand-maintained copy
  of the branded loader look, so visual changes to the loader no longer live
  only in one place. Slow-profile devices briefly mount the splash markup
  before React removes it (it is static, so no JS cost).
- Follow-ups: none required. `Loader`/`Loader.css` must not be removed — still
  used as the Suspense fallback for lazy routes.
