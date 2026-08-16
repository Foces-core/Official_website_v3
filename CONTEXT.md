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
- **Cube easter egg** — the About-cube rapid-spin celebration. Spin
  counting lives in the pure `createSpinTracker` (`easterEggLogic.js`):
  fires after `target` spins within `gap` ms, gap-reset so casual spinning
  never triggers. What happens on a fire — no-repeat message pick, capped
  toast stack, velocity EMA — lives in `easterEggCelebration.js`.
  Touch-first phones get an easier bar (8/1.5s vs 20/0.8s desktop); the
  cube owns its touch gesture (`touch-action: none`) so rotating never
  scrolls the page. The same touch-ownership rule applies to the Execom
  team carousel (`.execom-swiper` / `.execom-cube-swiper`).
- **Team roster** — the Execom member cards. Single source of truth:
  `src/data/team.js` (`cardData`, `cubeSlides`, `advisor`), shape-guarded
  by `validateTeam` in CI. Each member has a **role** (Chairperson,
  Secretary, …) — deliberately named `role`, not the old `review`, since it
  holds a job title.
- **Boot splash** — the static inline `#boot-splash` in `index.html`
  (ADR-0005), faded on first paint; the branded `Loader` is the lazy-route
  Suspense fallback.
- **Echo slides carousel** — the Featuring slides. Single source of truth:
  `src/data/echoSlides.js` (`echoSlides` + the 3× `carouselSlides` wrap
  copy), shape-guarded by `validateEchoSlides` in CI — same pattern as
  events and the team roster.
- **Cube drag mechanics** — the About cube's motion orchestration
  (`useCubeDrag`): drag/wind-down/snap rAF loop, spin tracking, arrow-key
  wiring, keyboardLock registration. The celebration fires through the
  `onEggFire` seam. All decisions stay pure: timing windows are
  `cubeTiming` constants (`SNAP_GRACE_MS`, `WIND_DOWN_OVERRIDE_MS`,
  `ARROW_SPIN_GRACE_MS`, `DRAG_OVERRIDE_MS`) gated by
  `isManualOverrideActive`, spin accumulation is `splitSpins`.
- **Autoplay gating** — carousels autoplay only while on screen and not
  disabled (`reducedMotion`/`lowPower`): `useAutoplayOnScreen` + the pure
  `autoplayGate(visible, disable)`. One owner for both Featuring and
  TeamCarousel; the duplicated IntersectionObserver effects were the
  evidence.
- **Viewport seam** — reactive width for components (`useViewportWidth`)
  over the named `breakpoints.js` constants (`SMALL_SCREEN_MAX` 500,
  `MOBILE_MAX` 767, `DESKTOP_MIN` 768, `WIDE_SCREEN_MIN` 1024). `sizes`
  attributes are built from those constants. Distinct from the device
  profile — the profile deliberately carries no width field.
- **Carousel wrap math** — `src/utils/carouselWrap.js` (`normalizeIndex`,
  `wrapTarget`, `copyFor`): the seamless 3×-copy wrap shared by
  TeamCarousel and Featuring. One owner for both carousels.
- **Spec guard** — `pnpm check:specs`: every pure module (the ADR-0009
  globs, plus `src/Pages/**/*.js`) must be imported by a unit spec,
  enforced in CI — structural enforcement of ADR-0009, so an untested
  extraction fails the PR that introduces it.
- **Section scroll policy** — `src/utils/scrollToSectionLogic.js`
  (`sectionScrollBehavior`): maps `reducedMotion` to `'auto'` vs `'smooth'`,
  unifying cross-route and in-page anchor transitions across `App.jsx` and
  `Navbar.jsx` to respect WCAG 2.2 motion preferences.
- **Next-paint deferral** — `src/Pages/LandingPage/Navbar/navSpy.js`
  (`deferToNextPaint`): wraps the two-frame requestAnimationFrame contract so
  focus restoration and scroll actions execute after mobile drawer unmount
  and body scroll-lock release have settled.
- **ARIA activation** — `src/utils/ariaActivation.js` (`isActivationKey`,
  `onActivationKey`): standardizes Enter and Space key activation for
  `role="button"` elements while preventing spacebar page scroll.
- **Honeypot spam defense** — `src/utils/validateContactForm.js`
  (`isSpamSubmission`) + `src/hooks/useContactForm.js` (ADR-0011): silently
  drops automated bot submissions with synthetic success toasts when hidden
  honeypot inputs are populated, preserving EmailJS quotas with zero external
  dependencies.
- **Contact draft persistence** — `src/utils/contactDraft.js`
  (`loadContactDraft`, `saveContactDraft`, `clearContactDraft`): auto-saves
  unsubmitted contact form input in `sessionStorage` and restores it on mount
  to prevent accidental data loss on reloads (ADR-0012).
- **Static pre-compression** — build-time generation of `.br` (Brotli) and
  `.gz` (Gzip) compressed siblings for all static text bundles via Node.js
  built-in `zlib` (ADR-0012).
- **Staging crawler exclusion** — crawler blocking via `<meta name="robots" content="noindex, nofollow" />`
  and `public/robots.txt` for the upstream repository until formal release forks (ADR-0012).
