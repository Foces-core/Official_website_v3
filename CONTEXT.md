# CONTEXT.md — Domain glossary

Shared vocabulary for the FOCES site. Keep this current as new concepts are
named; the /domain-modeling skill sharpens fuzzy terms here.

- **Event** — a past or upcoming fest event (Prompt Paradox, Coding Arena,
  Agentic Workshop…). Single source of truth: `src/data/events.js`
  (ADR-0003), shape-guarded by `validateEvents` (live-data test runs in CI).
- **Event photo** — a single `{ url, srcset }` pair. `url` feeds `<img src>`,
  `srcset` the responsive candidates. Built by `eventPhotos.photoTriplet`;
  the width-accuracy rule (never declare a file wider than its intrinsic
  size, never repeat a URL at two widths) is enforced by `validateEvents`.
- **Contact form module** — `useContactForm` (`src/hooks/useContactForm.js`):
  owns values, validation, the EmailJS-vs-mailto channel decision
  (`resolveSendChannel`), and toast feedback. `ContactUs.jsx` is
  presentational. `CONTACT_EMAIL` is the single inbox constant.
- **Device profile** — the resolved `{ slowNetwork, lowCPU, reducedMotion,
lowPower }` from `detectProfile`. One seam, two entries: components
  subscribe reactively via the `useDeviceProfile` hook, non-React code reads
  `detectProfile()` once. Never re-implement a heuristic or override
  elsewhere.
- **ScrollGate** — mounts a lazy section only when it approaches the
  viewport, so swiper-vendor never evaluates at boot. The mount decision is
  the pure `shouldMountSection`.
- **Boot splash** — the static inline `#boot-splash` in `index.html`
  (ADR-0005), faded on first paint; the branded `Loader` is the lazy-route
  Suspense fallback.
