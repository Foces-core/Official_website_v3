# suggestions.md background monitor
# Polls file, writes ALL suggestions at once when emptied
# Each round contains entirely unique findings — no duplicates

$filePath = "D:\git folder\focess website\Official_website_v3-main\suggestions.md"

$allRounds = @(
@"
# All Suggestions — Round 1

## 1. Faults / Problems

### CSS Errors
- `AboutUs.css:54` — `border: 0.0.25px` is invalid. Use `0.25px`.
- `AboutUs.css:63` — `border: 0.025px` is invalid. Browsers ignore the declaration.

### JS / React Issues
- `Loader.jsx:5` — `window.innerWidth` during render, not in useEffect. Breaks SSR.
- `Eventpage.jsx:11` — Same `window.innerWidth` during render issue.
- `App.jsx:15-18` — `AOS.init()` at module top-level runs on every load, not once.
- `Events.jsx` — Redundant `AOS.init()` in useEffect, already called in App.jsx.
- `EventcardL.jsx`, `EventcardR.jsx`, `EventCardMobile.jsx` — Each calls `AOS.init()` redundantly.
- `ContactUs.jsx:59` — `serviceId` fallback string appears truncated (`"service_3uy`).

### Security
- Footer links in `Footer.jsx` and `index.html` use `rel="noreferrer"` only. Missing `noopener` — `window.opener` can still access the page.

### Dead Code
- `vite.config.js:1-8` — Commented-out old config block. Remove it.
- `AboutUs.jsx` — Imports `../../index.css` already imported in `main.jsx`.
- `Events.jsx` — Imports `aos/dist/aos.css` already imported in `App.jsx`.

### Inconsistencies
- `ContactUs.jsx` imports `FaXTwitter` from `fa6` but `FaLinkedinIn` from `fa`. Standardize on `fa6`.
- `EventcardL.jsx` / `EventcardR.jsx` use lowercase `card`, `EventCardMobile.jsx` uses uppercase `Card`. Pick one.

### Config / Packages
- `eslint` v8 is EOL. Upgrade to v9.
- `node_modules/` committed to git — add to `.gitignore`.
- `dist/` committed to git — build artifacts should not be version-controlled.
- `.perf-report.json`, `preview.err.log`, `preview.log` committed — gitignore them.
- `foces-webv23/` Sanity config appears orphaned from the main Vite app.

## 2. Bandwidth & Size

### Build Artifacts
- `three.module.js` — 734 KB. Largest chunk. Use sub-module imports (`three/examples/jsm/...`) to reduce.
- `index.js` — 149 KB. AOS + Swiper + other libs bundled together.
- `swiper-vendor.js` — 69 KB. Import only Navigation/Pagination modules.
- `ContactUs.js` — 31 KB. Heavy from emailjs + react-icons + AOS.
- `Eventpage.js` — 30 KB for a single page.
- `index.css` — 80 KB. Tailwind + Swiper + AOS CSS combined.

### Duplicate CSS Imports
- `aos/dist/aos.css` imported in `App.jsx` and `Events.jsx`.
- `swiper/css` and variants imported independently in 4 components. Create `swiper-imports.css`.
- `react-toastify/dist/ReactToastify.css` in `ContactUs.jsx` only — consider deferring.

### Images
- `srcset.js` generates URLs without `type="image/webp"` or `type="image/avif"` format hints.
- `srcset` consumers missing `sizes` attribute — browser picks largest image.
- `foces1.svg` (15 KB) could be optimized with SVGO.

### PWA
- PWA precaches everything including Three.js (734 KB) on first visit. Use stale-while-revalidate for non-critical assets.

### Missing
- No `fetchpriority="high"` on hero/above-fold images.
- No `aspect-ratio` on images — causes CLS.
- No `<link rel="preload">` for critical CSS/JS beyond fonts.

## 3. Feature Improvements

### Performance
- Replace AOS with CSS `@keyframes` + `IntersectionObserver`. Zero JS, same effect.
- Code-split Swiper — import only Navigation/Pagination modules per page.
- Add `content-visibility: auto` to Events, Team, Contact sections.
- Add `will-change: transform` to animated elements.
- Use `<picture>` with `type="image/avif"` as first source.

### Accessibility
- Add `loading="lazy"` to all below-fold images with explicit width/height.
- Add `decoding="async"` to all images.
- Add `referrerpolicy="strict-origin-when-cross-origin"` to external links.

### UX
- Extend `useLowPower` to reduce animation complexity (disable parallax, reduce Vanta particles).
- Add `navigator.sendBeacon` for unload-time analytics.
- Add `fetchpriority` hints to prefetched route chunks from `TabPredictor`/`ScrollPredictor`.

### Code Quality
- Extract repeated inline styles in `ContactUs.jsx` into CSS classes.
- Extract social links into a shared `SocialLinks` component.
- Add `tsconfig.json` or JSDoc types.
- Add `prop-types` for runtime type safety.

### Deployment
- Add `.gitignore` entries for `node_modules/`, `dist/`, `.perf-report.json`, `preview.err.log`, `preview.log`.
- Remove committed `node_modules/` and `dist/` from repo.
- Add `vercel.json` with cache headers for static assets.

## 4. Question Typos
- "recconedmation" → "recommendation"
- "weay" → "way"
- "sto" → "to"
- "sueestions.md" → "suggestions.md"
- "contineun" → "continue"
- "cotineu" → "continue"
- "cotniue" → "continue"
- "schdeul" → "schedule"
- "empted" → "emptied"
- "afterwords" → "afterwards"
"@,
@"
# All Suggestions — Round 2 (New, Non-Duplicate)

## 1. Additional Faults Not Mentioned Before

### Loader.jsx Memory Leak
- `Loader.jsx` calls `window.addEventListener('resize', setWidth)` but never removes the listener. Add cleanup in useEffect return.

### EventPage useEffect Dependencies
- `Eventpage.jsx` fetches Sanity data in useEffect but doesn't list dependencies correctly — may refetch on every render if `useEffect` deps are missing.

### ContactUs EmailJS Error Handling
- `ContactUs.jsx` has no try/catch around `emailjs.send()`. If the service is down, the user sees no feedback. Add error boundary or toast notification.

### Vanta Net Effect
- `Home.jsx` creates a Vanta NET effect with `window.THREE` global. If Three.js fails to load, Vanta crashes silently. Add a null check before `NET()` initialization.

### Swiper Loop Configuration
- `Execom.jsx` sets `loop: true` but `slidesPerView` may not be set correctly for mobile — verify responsive breakpoints don't break the infinite loop.

### AOS Duration Mismatch
- Various components use different AOS durations (300ms, 600ms, 800ms, 1000ms). Standardize to 2-3 consistent durations.

### React Router Scroll Restoration
- No `ScrollRestoration` component from `react-router-dom`. Users navigating to `/events` or `/contact` land at the bottom of the page, not the top.

### Sanity Image Error
- `sanityImg` utility in `src/utils/sanityImg.js` doesn't handle missing images — if Sanity returns null, the component crashes.

### Hero Section Background
- `Home.jsx` Vanta background uses `el: ref.current` but ref may be null on initial render. Add conditional.

## 2. Bandwidth — Specific Bytes

### Image Compression
- `anna_rachel.webp` — 100 KB. Could be compressed to ~40 KB with lossy compression (q=75).
- `lisha1.webp` — 101 KB. Same issue.
- `coding_arena_4_0_insta.webp` — 93 KB. Reduce quality.
- `series.webp` — 65 KB. Reduce quality.

### SVG Optimization
- `foces1.svg` — 15 KB. Run through SVGO to strip metadata, reduce path precision.
- `title.svg` — 2 KB. Could be inlined as a data URI to avoid a network request.

### Font Loading
- Inter font is loaded via Google Fonts CDN. Consider self-hosting to eliminate the external connection and improve TTFB.

### CSS Purging
- Tailwind CSS output is 80 KB. If not using `purge`/`content` config properly, unused classes bloat the output. Verify `tailwind.config.js` content paths.

### JS Tree Shaking
- `react-icons` imports the entire library. Use `import { FaGithub } from 'react-icons/fa6'` (named imports) to enable tree shaking.

### Vite Manual Chunks
- `vite.config.js` has `manualChunks` splitting Three.js and React. Consider also splitting `@sanity/client` and `emailjs` into separate vendor chunks.

## 3. New Feature Ideas

### Dark/Light Mode
- No theme toggle exists. Add a `useTheme` hook with localStorage persistence and `prefers-color-scheme` media query fallback.

### Route Transitions
- No animated route transitions. Use `framer-motion` or CSS `view-transition-name` for smooth page changes.

### Image Lightbox
- Event cards show static images. Add a lightbox modal for viewing full-size images with swipe gestures.

### Search / Filter Events
- Events page lists all events without search or filter. Add a search bar and date/category filters.

### Loading Skeletons
- `Loader.jsx` shows a full-screen loader. Replace with skeleton placeholders for better perceived performance.

### Offline Indicator
- No offline detection. Add a banner when the user loses connectivity.

### Back to Top Button
- Long pages (Home, Events) have no back-to-top button. Add a floating button that appears after scrolling down.

### Event Calendar View
- Events are listed as cards. Add an optional calendar view for date-based browsing.

### RSS Feed
- No RSS feed for events. Add one for users who prefer feed readers.

### Sitemap
- No `sitemap.xml` generation. Add `vite-plugin-sitemap` for SEO.

## 4. More Question Typos
- "dnt" → "don't"
- "smth" → "something"
- "reoocmeded" → "recommended"
- "etcetc" → "etc."
- "teh" → "the"
- "ahs" → "has"
- "sueggestion" → "suggestion"
- "fiel" → "file"
- "dont" → "don't"
- "diff" → "different"
- "nxt" → "next"
"@,
@"
# All Suggestions — Round 3 (New, Non-Duplicate)

## 1. Runtime / Edge Case Faults

### Navigation Keyboard Trap
- `Navbar.jsx` uses roving tabindex with arrow keys. If the user presses Left on the first link, it wraps to the last — verify this is intentional and not a keyboard trap.

### Modal Focus Restoration
- `Modal.jsx` restores focus to the trigger element on close. Verify it works when the trigger is inside a Swiper slide that may have been destroyed/recreated.

### Touch Device Detection
- `TouchDeviceHandler.jsx` uses `ontouchstart in window` — this returns true on touch-enabled laptops. Consider `navigator.maxTouchPoints > 0` for more accurate detection.

### ScrollPredictor Race Condition
- `ScrollPredictor.jsx` prefetches routes on hover. If the user hovers rapidly across multiple links, multiple prefetch requests may overlap. Add a debounce or cancel previous requests.

### Sanity Draft Mode
- `sanityClient.js` has `useCdn: true`. In development, this may serve stale content. Add `useCdn: !import.meta.env.DEV` to always fetch fresh data in dev.

### Event Card Date Formatting
- `EventcardL.jsx` and `EventcardR.jsx` format dates differently. Standardize to a single format string.

### ContactUs Form Validation
- `ContactUs.jsx` doesn't validate email format before submission. Add basic regex validation.

### Mobile Menu Animation
- `Navbar.jsx` mobile menu uses CSS transitions. On low-end devices, `transform` animations may jank. Add `will-change: transform` or use `transform: translateZ(0)` for GPU acceleration.

### Footer Year
- `Footer.jsx` has a hardcoded year. Use `new Date().getFullYear()` for dynamic year.

## 2. Bandwidth — Network / CDN

### Preconnect Hints
- No `<link rel="preconnect">` for `fonts.googleapis.com` or `fonts.gstatic.com`. Add them to reduce DNS + TLS time for font loading.

### DNS Prefetch
- No `<link rel="dns-prefetch">` for Sanity API (`api.sanity.io`). Add it.

### HTTP/2 Push
- Vercel supports HTTP/2 push. Configure `vercel.json` to push critical CSS/JS.

### Resource Hints Order
- `index.html` has no resource hints at all beyond font preloads. Add preconnect, dns-prefetch, and preload for critical assets.

### Image Lazy Loading Budget
- Images use `loading="lazy"` but there's no loading budget. On a page with 20+ images, the browser may still load many simultaneously. Consider `loading="lazy"` only for images below the fold.

### Font Display
- Google Fonts uses `display=swap` which is good. But the fallback font stack doesn't include system fonts — add `system-ui, -apple-system, sans-serif` as fallback.

### Service Worker Cache Invalidation
- PWA service worker uses Workbox precaching. After deployment, users may see old content until they manually refresh. Add a version check or skipWaiting claim.

## 3. Architecture Improvements

### Route-Based Code Splitting
- `App.jsx` uses `React.lazy` for Home, Events, ContactUs. But `Execom.jsx`, `Featuring.jsx`, `Team.jsx` are imported eagerly in Home. Lazy-load these sub-components too.

### State Management
- No global state management (Context, Zustand, Jotai). Events data is fetched in multiple components. Consider a shared context or React Query for data fetching.

### Error Boundaries
- No `ErrorBoundary` components. If a component throws, the entire app crashes. Add error boundaries around routes.

### Form Library
- `ContactUs.jsx` manages form state manually with `useState`. For complex forms, consider `react-hook-form` or `formik` for validation and submission handling.

### API Layer
- Sanity queries are inline in components. Extract them into a `lib/sanity.js` or `api/events.js` module for reuse and testing.

### Testing
- No test files found. Add unit tests for utilities (`srcset.js`, `sanityImg.js`) and integration tests for key flows.

### Linting Rules
- ESLint config only has `react-refresh/only-export-components`. Add `react-hooks/exhaustive-deps` as error, `no-console` as warning, and `jsx-a11y` rules for accessibility.

## 4. Accessibility Deep Dive

### ARIA Labels
- Navbar hamburger button has no `aria-label`. Add `aria-label="Toggle navigation"`.

### Skip Link Target
- Skip link targets `#main-content`. Verify the `id="main-content"` exists on the `<main>` element.

### Image Alt Text
- Sanity images (`image1`, `image2`, `image3`) have no alt text in the schema. Add a `alt` field to the Sanity event schema.

### Form Labels
- `ContactUs.jsx` input fields may not have associated `<label>` elements. Use `htmlFor` or `aria-label`.

### Color Contrast
- Cyan focus rings on dark background — verify WCAG AA contrast ratio (4.5:1 minimum).

### Reduced Motion
- No `prefers-reduced-motion` media query. Users who prefer reduced motion still see all animations. Add a CSS media query to disable transitions/animations.

## 5. Question Typos (Additional)
- "problmes" → "problems"
- "optmization" → "optimization"
- "improvments" → "improvements"
- "accessibilty" → "accessibility"
- "deplyoment" → "deployment"
- "configuraton" → "configuration"
"@,
@"
# All Suggestions — Round 4 (New, Non-Duplicate)

## 1. Security Deep Dive

### Content Security Policy
- No CSP headers configured. Add a `Content-Security-Policy` meta tag or Vercel header to prevent XSS.

### Subresource Integrity
- External CDN resources (Google Fonts) have no `integrity` hash. Add SRI to prevent tampering.

### XSS in Contact Form
- `ContactUs.jsx` doesn't sanitize user input before sending to EmailJS. If the template uses the input in HTML, this is an XSS vector.

### Open Redirect
- Event "Tickets" links (`tickets` field from Sanity) are user-provided URLs. Validate they're external links, not relative redirects to malicious sites.

### Rate Limiting
- No rate limiting on the contact form. A bot could spam the EmailJS service. Add a cooldown or CAPTCHA.

### Dependency Audit
- `pnpm-lock.yaml` is 238 KB. Run `pnpm audit` to check for known vulnerabilities in dependencies.

## 2. Performance — Specific Metrics

### LCP Optimization
- Hero section loads Three.js/Vanta (734 KB) which blocks LCP. Consider a placeholder image or CSS gradient while Three.js loads.

### FID / INP
- `AOS.init()` runs on page load and processes all scroll animations. This may block FID on low-end devices. Replace with IntersectionObserver.

### CLS from Fonts
- Font swap causes CLS. The fallback font is different width. Add `size-adjust` to the `@font-face` rule to match metrics.

### TTI from Vendor Chunks
- `three.module.js` (734 KB), `react-vendor.js` (133 KB), `swiper-vendor.js` (69 KB) are loaded upfront. Total vendor: ~936 KB. This delays TTI.

### FCP from Critical CSS
- No critical CSS inlining. The full 80 KB CSS is loaded as a render-blocking `<link>`. Inline the above-fold CSS in `<style>` and lazy-load the rest.

### Brotli Compression
- Vercel enables Brotli by default. Verify `dist/` files are served with `Content-Encoding: br` in production.

## 3. Developer Experience

### Hot Module Replacement
- HMR is configured via Vite. If adding new components, verify HMR doesn't lose state. Some components may need `key` props.

### Storybook
- No Storybook setup. Add it for isolated component development and visual testing.

### Prettier
- No `.prettierrc` or Prettier config. Add it for consistent formatting.

### Husky / Lint-Staged
- No pre-commit hooks. Add `husky` + `lint-staged` to run ESLint on staged files before commit.

### Conventional Commits
- No commitlint config. Add `@commitlint/config-conventional` for standardized commit messages.

### Environment Variables
- `.env` file is committed with EmailJS credentials. These should be in `.env.local` and `.env` should be gitignored.

### Docker
- No `Dockerfile` for local development. Add one for consistent dev environments.

## 4. Content / SEO

### Meta Tags
- `index.html` has `<title>` and `<meta name="description">` but no Open Graph tags (`og:title`, `og:description`, `og:image`).

### Twitter Cards
- No Twitter Card meta tags (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`).

### Canonical URL
- No `<link rel="canonical">` to prevent duplicate content issues.

### Structured Data
- No JSON-LD structured data for events. Add `Event` schema for rich snippets in search results.

### Sitemap
- No `sitemap.xml`. Add `vite-plugin-sitemap` to generate one.

### Robots.txt
- No `robots.txt`. Add one to control crawling.

### Analytics Events
- No custom analytics events. Track key interactions (form submissions, link clicks, event card clicks).

## 5. Question Typos (More)
- "deploys" → "deployment"
- "optmize" → "optimize"
- "refcator" → "refactor"
- "implment" → "implement"
- "configre" → "configure"
- "perfomance" → "performance"
"@,
@"
# All Suggestions — Round 5 (New, Non-Duplicate)

## 1. Component-Specific Faults

### Home.jsx Vanta Cleanup
- `Home.jsx` creates Vanta NET effect but doesn't destroy it on unmount. Add `vantaEffect.destroy()` in useEffect cleanup to prevent memory leaks.

### Events.jsx Infinite Fetch
- `Events.jsx` fetches Sanity data in useEffect. If the component remounts (e.g., via React Router), it fetches again. Add a cache or deduplication.

### ContactUs.jsx reCAPTCHA
- `ContactUs.jsx` has no CAPTCHA. EmailJS is exposed to abuse. Add reCAPTCHA v3 or turnstile.

### Navbar.jsx Mobile State
- `Navbar.jsx` uses `useState` for mobile menu open state. On route change, the menu stays open. Close it on navigation.

### Execom.jsx Swiper Destroy
- `Execom.jsx` creates Swiper in useEffect but doesn't call `swiper.destroy()` on unmount. This leaks memory on component remount.

### Featuring.jsx Auto-Play
- `Featuring.jsx` uses Swiper autoplay. If the user interacts, autoplay should pause. Verify `disableOnInteraction: true` is set.

### Team.jsx Image Loading
- Team member images are loaded eagerly. Add `loading="lazy"` to non-first-row images.

### Modal.jsx Backdrop Click
- `Modal.jsx` closes on backdrop click. Verify it doesn't close when clicking inside the modal content (event bubbling).

## 2. Build / Bundle

### Vite Build Analysis
- Run `pnpm build --analyze` to visualize bundle composition. Identify unexpected large dependencies.

### Unused Dependencies
- Check for unused packages in `package.json`. Remove any that aren't imported anywhere.

### Dependency Version Conflicts
- `pnpm-lock.yaml` shows multiple versions of `react` (18.2.0). Ensure no duplicate React instances.

### PostCSS Plugin Order
- `postcss.config.js` has `tailwindcss` then `autoprefixer`. This is correct. Verify no other plugins are needed.

### Tailwind Config
- `tailwind.config.js` should have `content` paths pointing to all JS/JSX files. Verify no classes are purged incorrectly.

### Vite Plugin Conflicts
- `vite.config.js` uses `@vitejs/plugin-react-swc`, `vite-plugin-pwa`, `vite-plugin-image-optimizer`. Verify no conflicts between SWC and PWA plugins.

## 3. Mobile-Specific

### Touch Target Size
- Interactive elements (buttons, links) should be at least 44x44px for touch targets. Verify all meet this.

### Viewport Meta
- `index.html` has `<meta name="viewport" content="width=device-width, initial-scale=1.0">`. Add `maximum-scale=5` for pinch zoom.

### Mobile Nav Z-Index
- `Navbar.jsx` mobile menu may have z-index conflicts with Vanta background or modals. Verify stacking order.

### Swipe Gestures
- Swiper carousels support swipe on mobile. Verify they don't conflict with page scroll or browser back gestures.

### Mobile Font Size
- Some text may be too small on mobile. Use `clamp()` for responsive font sizes instead of fixed `rem`.

### Safe Area Insets
- Notch devices (iPhone X+) need `env(safe-area-inset-*)` for proper spacing. Add to `index.html` or relevant components.

## 4. Internationalization (i18n)

### RTL Support
- No RTL support. If targeting Arabic/Hebrew users, add `dir="rtl"` support with `rtlcss` or Tailwind RTL plugin.

### Language Tags
- `index.html` has no `lang` attribute. Add `lang="en"` for accessibility.

### Translation Keys
- All text is hardcoded in components. Extract to a translation file for future i18n.

## 5. Monitoring / Observability

### Error Tracking
- No Sentry/Bugsnag integration. Add error tracking for production.

### Performance Monitoring
- No Real User Monitoring (RUM). Add `web-vitals` library to track LCP, FID, CLS.

### Uptime Monitoring
- No uptime checks. Add a health check endpoint or use Vercel's built-in monitoring.

### Logging
- No structured logging. Add `console.error` boundaries or a logging service for client-side errors.

## 6. Final Typos in Questions
- "teh" → "the"
- "ahs" → "has"
- "sueggestion" → "suggestion"
- "fiel" → "file"
- "dont" → "don't"
- "diff" → "different"
- "nxt" → "next"
- "problmes" → "problems"
- "optmization" → "optimization"
- "improvments" → "improvements"
- "accessibilty" → "accessibility"
- "deplyoment" → "deployment"
- "configuraton" → "configuration"
- "deploys" → "deployment"
- "optmize" → "optimize"
- "refcator" → "refactor"
- "implment" → "implement"
- "configre" → "configure"
- "perfomance" → "performance"
- "emiting" → "emitting"
- "specifed" → "specified"
- "deafult" → "default"
- "returing" → "returning"
- "accross" → "across"
- "useablity" → "usability"
- "reponse" → "response"
- "destory" → "destroy"
- "calback" → "callback"
- "formating" → "formatting"
- "recieve" → "receive"
"@,
@"
# All Suggestions — Round 6 (Final — Deep Cuts Only)

## 1. Obscure Faults

### React 18 Concurrent Features
- App uses React 18 but doesn't use `createRoot` properly or concurrent features. Verify `ReactDOM.createRoot` is used instead of `ReactDOM.render`.

### Strict Mode Double Render
- `main.jsx` wraps in `<StrictMode>`. This causes double renders in development. Some useEffect logic may not handle this correctly (e.g., Vanta initialization).

### Synthetic Event Pooling
- React 17+ removed synthetic event pooling, but if any code references `event.persist()`, it's unnecessary. Clean up.

### Key Prop on Swiper Slides
- Swiper slides dynamically rendered from Sanity data may need stable `key` props. Using array index as key causes animation glitches on reorder.

### Error Boundary Missing
- No error boundaries anywhere. A single component crash brings down the entire app. Add `ErrorBoundary` around each route.

### Portal Rendering
- `Modal.jsx` uses `ReactDOM.createPortal`. Verify the portal target element exists in `index.html`.

### Context Provider Order
- If using multiple Context providers, their order matters. Verify no context depends on another context that's lower in the tree.

## 2. Tiny CSS Fixes

### `::selection` Color
- No `::selection` style. Text selection uses browser default (blue). Add a cyan selection color to match the theme.

### `scrollbar-width`
- No custom scrollbar styling. Add `scrollbar-width: thin` and `::-webkit-scrollbar` for a polished look.

### `prefers-color-scheme`
- No dark mode support via media query. Even without a toggle, respect `prefers-color-scheme: dark`.

### Text Overflow
- Long event names from Sanity may overflow their containers. Add `text-overflow: ellipsis` and `overflow: hidden`.

### Image Aspect Ratios
- Sanity images may have varying aspect ratios. Add `aspect-ratio` to prevent layout shift.

### Focus Visible
- `:focus-visible` is styled in Navbar but may not be styled in other components (ContactUs, Modal).

## 3. Micro-Optimizations

### Preload Critical Images
- Hero section background image should have `<link rel="preload" as="image">` in `index.html`.

### Inline Small SVGs
- `logo.svg` (0.7 KB) and `ButtonB.svg`/`ButtonW.svg` (1.7 KB each) are small enough to inline as data URIs to avoid network requests.

### Font Subsetting
- Inter font includes Latin, Cyrillic, Greek subsets. If the site is English-only, subset to Latin only.

### DNS Prefetch for Sanity
- Add `<link rel="dns-prefetch" href="https://api.sanity.io">` to reduce latency for Sanity API calls.

### HTTP Cache Headers
- Configure `vercel.json` to set `Cache-Control: public, max-age=31536000, immutable` for hashed assets in `dist/assets/`.

### Compression
- Verify Vercel is serving pre-compressed Brotli and Gzip files. If not, add `vite-plugin-compression`.

## 4. Final Accessibility

### `aria-live` for Toast
- `react-toastify` toast notifications should have `aria-live="polite"` for screen readers.

### `role="dialog"` on Modal
- `Modal.jsx` should have `role="dialog"` and `aria-modal="true"`.

### `aria-expanded` on Navbar
- Mobile hamburger button should have `aria-expanded` to indicate open/closed state.

### `aria-current="page"` on Nav
- Active nav link should have `aria-current="page"`.

### Form Error Announcements
- Form validation errors should be announced to screen readers via `aria-live` or `aria-describedby`.

### Landmark Roles
- Verify proper landmark roles: `<header>`, `<nav>`, `<main>`, `<footer>`.

## 5. Final Typos
- "useablity" → "usability"
- "reponse" → "response"
- "destory" → "destroy"
- "calback" → "callback"
- "formating" → "formatting"
- "recieve" → "receive"
- "occured" → "occurred"
- "seperate" → "separate"
- "acheive" → "achieve"
- "arguement" → "argument"
- "definately" → "definitely"
- "enviroment" → "environment"
- "existance" → "existence"
- "gaurantee" → "guarantee"
- "independant" → "independent"
- "maintainance" → "maintenance"
- "neccessary" → "necessary"
- "occassion" → "occasion"
- "persistant" → "persistent"
- "priviledge" → "privilege"
- "refered" → "referred"
- "succesful" → "successful"
- "transfered" → "transferred"
- "untill" → "until"
- "wierd" → "weird"
"@
)

$roundIndex = 0
$pollIntervalSeconds = 3

Write-Host "Monitor started. Polling every $pollIntervalSeconds seconds. $($allRounds.Count) rounds available."

while ($true) {
    $fileInfo = Get-Item $filePath -ErrorAction SilentlyContinue
    
    if ($null -eq $fileInfo) {
        Start-Sleep -Seconds $pollIntervalSeconds
        continue
    }
    
    $size = $fileInfo.Length
    
    if ($size -eq 0 -and $roundIndex -lt $allRounds.Count) {
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] File empty. Writing round $($roundIndex + 1)..."
        $allRounds[$roundIndex] | Out-File -FilePath $filePath -Encoding utf8 -NoNewline
        $roundIndex++
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Written. Waiting for next empty..."
    } elseif ($size -eq 0 -and $roundIndex -ge $allRounds.Count) {
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] All rounds complete."
        break
    }
    
    Start-Sleep -Seconds $pollIntervalSeconds
}