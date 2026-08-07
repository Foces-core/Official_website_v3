# Round 2 — Bandwidth & Size Optimization

## Duplicate / Redundant CSS Imports

- `aos/dist/aos.css` imported in both `App.jsx` and `Events.jsx`. Remove the `Events.jsx` import.
- `swiper/css`, `swiper/css/navigation`, `swiper/css/pagination`, `swiper/css/scrollbar` imported independently in `Execom.jsx`, `EventcardL.jsx`, `EventcardR.jsx`, `EventCardMobile.jsx`. Create a single `swiper-imports.css` and import it once.
- `react-toastify/dist/ReactToastify.css` imported in `ContactUs.jsx` only — this is fine, but consider inlining critical toast styles or deferring the import.

## Image Assets — Missing Format Hints

- `src/utils/srcset.js` generates `srcset` URLs but does not include `type="image/webp"` or `type="image/avif"` format hints. Browsers cannot select the optimal format without `<source type="...">`.
- `srcset` consumers may not be using `sizes` attributes — without `sizes`, the browser picks the largest image regardless of viewport width.

## PWA Precache Strategy

- PWA precaches everything on first visit, meaning the full bundle (including Three.js 734 KB) is downloaded immediately. Consider a stale-while-revalidate strategy for non-critical assets like Three.js and Swiper.

## Missing Performance Attributes

- No `fetchpriority="high"` on hero image or above-fold images.
- No `aspect-ratio` on images — can cause CLS.
- No `<link rel="preload">` for critical CSS/JS beyond font preloads.
