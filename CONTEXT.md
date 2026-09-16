# CONTEXT.md — Domain glossary

Shared vocabulary for the FOCES site. Keep this current as new concepts are
named; the /domain-modeling skill sharpens fuzzy terms here.

> Single canonical glossary (per `CLAUDE.md`) — aliases, relationships, and
> flagged ambiguities live here too, so terms never fork across files.

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
  viewport, so the carousel sections' code never evaluates at boot. The
  mount decision is the pure `shouldMountSection`.
- **Cube easter egg** — the About-cube rapid-spin celebration. Spin
  counting lives in the pure `createSpinTracker` (`easterEggLogic.js`):
  fires after `target` spins within `gap` ms, gap-reset so casual spinning
  never triggers. What happens on a fire — no-repeat message pick, capped
  toast stack, velocity EMA — lives in `easterEggCelebration.js`.
  Touch-first phones get an easier bar (8/1.5s vs 20/0.8s desktop); the
  cube owns its touch gesture (`touch-action: none`) so rotating never
  scrolls the page. The same touch-ownership rule applies to the Execom
  team carousel (`.execom-swiper` / `.execom-cube-swiper`), which is
  hand-rolled (`useCarousel` + `carouselGeometry`) — the old Swiper was
  replaced to drop the ~104 KB vendor chunk.
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
  disabled (`reducedMotion`/`lowPower`): the visibility gating is internal
  to `useCarousel` (IntersectionObserver on the wrapper, threshold 0.1),
  with autoplay pauses on drag and on the off-screen state.
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
- **Canonical production deployment** — [https://focess-five.vercel.app/](https://focess-five.vercel.app/): the continuous deployment edge target linked to `main` with immutable asset caching and security headers via `vercel.json`.
- **Scrollspy** — viewport-geometry evaluation marking which section is currently active for the navbar.
- **Navigation coordinator** — deep orchestration module (`navigationCoordinator.js`) unifying section scroll, overlay dismissal, body lock release, and paint deferral.
- **Hero waves stage** — WebGL lifecycle adapter (`HeroStage/heroWavesStage.js`) for the Three.js/Vanta hero background, with context-loss recovery and low-power fallback.
- **Roving tabindex** — APG pattern where exactly one item in a composite widget owns `tabindex="0"` while siblings hold `tabindex="-1"`.
- **Keyboard arbitration** — priority system granting arrow-key control to exactly one active on-screen widget (`keyboardLock.js`).
- **Scroll lock** — reference-counted body scroll lock held while modal overlays or drawers are open (`scrollLock.js`).
- **Overlay lifecycle** — unified open/close lifecycle for modals and drawers (scroll-lock, focus entry, tab trapping, Escape, focus restore).
- **Route prefetch** — idle/intent/trajectory-based route-chunk loading, gated by the network profile.
- **Echo slide** — highlighted feature card in the Featuring carousel (`echoSlides.js`).

## Aliases to avoid

Say the canonical term, never the alias:

- Section scroll policy — not "smooth scroll flag" / "animation setting"
- Next-paint deferral — not "delay timer" / "setTimeout hack" / "double rAF"
- Navigation coordinator — not "scroll manager" / "nav helper"
- Hero waves stage — not "3D background" / "canvas effect"
- Roving tabindex — not "tab manager" / "focus switcher"
- Viewport seam — not "screen size watcher" / "media query helper"
- ARIA activation — not "key handler" / "click simulator"
- Keyboard arbitration — not "focus lock" / "key dispatcher"
- Scroll lock — not "body freeze" / "modal backdrop lock"
- Overlay lifecycle — not "modal manager" / "popup controller"
- Route prefetch — not "page preload" / "quick loader"
- Event — not "activity" / "programme"
- Event photo — not "image item" / "picture record"
- Team roster — not "member list" / "committee data"
- Echo slide — not "carousel card" / "showcase banner"
- ScrollGate — not "lazy loader" / "suspense trigger"
- Cube drag mechanics — not "3D container" / "cube rotator"
- Easter egg celebration — not "spin reward" / "bonus animation"
- Honeypot spam defense — not "bot blocker" / "captcha gate"
- Contact draft persistence — not "form storage" / "auto-save state"
- Scrollspy — not "nav watcher" / "section highlighter"

## Relationships

- A **Device profile** governs both **Autoplay gating** and the **Section scroll policy**.
- A **Scroll lock** reference count increments on each open overlay (**Navbar mobile drawer**, **Event modal**) and releases only when the count returns to zero.
- **Next-paint deferral** executes focus restoration after the **Scroll lock** has released on overlay unmount.
- **Keyboard arbitration** evaluates the topmost on-screen widget among the **Cube drag mechanics** and **Team carousel**.
- **ARIA activation** converts Enter and Space keystrokes into synthetic activation for custom interactive elements.

## Example dialogue

> **Dev:** "How should the mobile navbar restore focus when closed?"
> **Domain expert:** "Use **Next-paint deferral**. It waits two frames so the **Scroll lock** unmounts cleanly before focusing the toggle."
> **Dev:** "And if the user clicks a nav link while `prefers-reduced-motion` is active?"
> **Domain expert:** "The **Section scroll policy** resolves to `auto` rather than `smooth` so the scroll happens instantaneously."
> **Dev:** "Do custom gallery thumbnails need custom keyboard bindings?"
> **Domain expert:** "Yes, bind them through **ARIA activation** so both Enter and Space trigger gallery expansion while preventing default spacebar page scrolling."

## Flagged ambiguities

- `"review"` vs **Role**: the Execom data previously used `review` to hold member titles; canonically it is **Role** (`Chairperson`, `Secretary`, …).
- `"animation"` vs **Section scroll policy**: anchor transitions must never hardcode CSS/DOM `smooth` — always consult the motion policy from the **Device profile**.
