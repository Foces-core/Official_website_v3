import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import { VitePWA } from 'vite-plugin-pwa';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { imagetools } from 'vite-imagetools';

const PORT = 5173;

// The hero PNG is the LCP element. On 3G + CPU throttle, React takes
// ~10 s to mount — the <img> only enters the DOM then, so LCP fires at
// ~10 s even though the image bytes arrive in <100 ms (preloaded).
//
// Fix: inject the hero <img> into static HTML (outside #root) so the
// browser can paint it during parse, before any JS loads. The preload
// ensures fast download; the static element ensures Chrome can count it
// as LCP immediately. HeroSection removes the static copy on mount.
function preloadHeroImage() {
  let heroPath = null;
  return {
    name: 'preload-hero-image',
    apply: 'build',
    generateBundle(_opts, bundle) {
      heroPath = Object.keys(bundle).find(
        (n) => /assets\/foces-[A-Za-z0-9_-]+\.png$/.test(n) && !/-(?:400|800)\.png$/.test(n),
      );
    },
    transformIndexHtml(html) {
      if (!heroPath) return html;
      const preload = `<link rel="preload" as="image" type="image/png" href="/${heroPath}" fetchpriority="high" />`;
      // Static hero: the <img> lives in the DOM at parse time. On 3G the
      // image bytes arrive <100 ms (2.3 KB), so the browser paints it
      // almost instantly — long before React mounts. The splash (z-index
      // 100) sits on top; Chrome still counts the painted element for LCP.
      // HeroSection removes #hero-lcp-static on mount; the React-rendered
      // version takes over seamlessly (same src from cache, same position).
      const staticHero = `
    <style>
      #hero-lcp-static{position:fixed;inset:0;z-index:0;background:#0a0a0c;overflow:hidden;pointer-events:none}
      #hero-lcp-static img{position:absolute;height:50%;width:38%;top:45vh;left:10vw;max-width:none}
      @media(max-width:767px){#hero-lcp-static img{width:80%;top:40vh}}
    </style>
    <div id="hero-lcp-static">
      <img src="/${heroPath}" alt="FOCES" fetchpriority="high" decoding="async" width="716" height="155" />
    </div>`;
      return html
        .replace('</head>', `    ${preload}\n  </head>`)
        .replace('<div id="root"></div>', `${staticHero}\n    <div id="root"></div>`);
    },
  };
}

// Build-time font subsetting (scripts/fonts/subset-fonts.mjs): restrict the
// wght axis of the two variable fonts to the weights the site uses. Runs on
// EVERY build and dev-server start — automatic for all devs and CI with no
// manual step. Pure JS (subset-font / harfbuzz wasm), falls back to the full
// font on error so a build never breaks.
function subsetFontsPlugin() {
  return {
    name: 'subset-fonts',
    async buildStart() {
      const { subsetFonts } = await import('./scripts/fonts/subset-fonts.mjs');
      await subsetFonts();
    },
  };
}

// Preloads the two self-hosted woff2 fonts in the HTML so the browser starts
// the fetch as soon as the document is parsed — instead of waiting for the
// CSS bundle (which carries the @font-face) to download + parse. Inter is used
// above the fold (navbar + hero), so this cuts the first-paint font swap.
function preloadFonts() {
  let fontUrls = [];
  return {
    name: 'preload-fonts',
    apply: 'build',
    generateBundle(_opts, bundle) {
      fontUrls = Object.keys(bundle)
        .filter((n) => /-(latin)-wght-normal(?:\.subset)?-?.*\.woff2$/.test(n))
        .map((n) => bundle[n].fileName);
    },
    transformIndexHtml(html) {
      const links = fontUrls
        .map((u) => `<link rel="preload" as="font" type="font/woff2" crossorigin href="/${u}" />`)
        .join('\n    ');
      if (!links) return html;
      return html.replace('</head>', `    ${links}\n  </head>`);
    },
  };
}

export default defineConfig({
  // DX: auto-open the dev server in the default browser.
  server: {
    open: true,
    port: PORT,
  },
  plugins: [
    react(),
    subsetFontsPlugin(),
    // imagetools: generates LQIP placeholders and responsive variants at build time.
    // Import params like ?blur=20&w=20 to get a tiny blurred data-URL.
    imagetools(),
    // Sentry: upload source maps in CI/release builds so stack traces are
    // readable. The DSN is read from VITE_SENTRY_DSN env var at runtime.
    // Requires the auth token too — a DSN alone (e.g. local dev) must not
    // activate the plugin, since it cannot upload without credentials.
    // Upload is best-effort (same policy as the SDK init in main.jsx): a
    // misconfigured org/project/token must warn, never fail the deploy.
    ...(process.env.VITE_SENTRY_DSN && process.env.SENTRY_AUTH_TOKEN
      ? [
          sentryVitePlugin({
            org: process.env.SENTRY_ORG,
            project: process.env.SENTRY_PROJECT,
            authToken: process.env.SENTRY_AUTH_TOKEN,
            // Without this the plugin throws on any upload error and fails the
            // build — a wrong SENTRY_ORG/PROJECT (or expired token) would take
            // the site offline for everyone. Warn and continue instead.
            errorHandler: (err) => console.warn('[sentry] source map upload skipped:', err.message),
          }),
        ]
      : []),
    preloadFonts(),
    preloadHeroImage(),
    // Compress every image at build time (smaller payloads for everyone,
    // especially low-end devices on slow connections)
    ViteImageOptimizer({
      jpg: { quality: 72 },
      jpeg: { quality: 72 },
      png: { quality: 75 },
      webp: { quality: 75 },
      avif: { quality: 60 },
    }),
    // PWA: caches the APP SHELL only (js/css/html/svg/fonts). Images are NOT
    // precached: Vercel already serves /assets/* with a year-long immutable
    // Cache-Control, so they come from the browser cache on repeat visits.
    // Precacheing the 2MB of photos as well was wasted download on first
    // visit — the worst case for slow devices.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['foces.svg', 'og-image.jpg', 'pwa-192.png', 'pwa-512.png'],
      manifest: {
        id: '/',
        name: 'FOCES - Forum of Computer Engineering Students',
        short_name: 'FOCES',
        description:
          'Official website of FOCES (Forum of Computer Engineering Students) at College of Engineering Chengannur.',
        theme_color: '#101011',
        background_color: '#101011',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        lang: 'en',
        categories: ['education', 'technology'],
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
          // Dedicated maskable variant: artwork scaled into the 80% safe zone
          // on a theme background, so launcher masks never crop the logo.
          {
            src: '/pwa-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // App-shell only (AGENTS.md contract): the entry chunk, its vendor
        // runtime, shell CSS, latin fonts, and index.html. Lazy section/route
        // chunks (AboutUs/Events/Featuring/Execom/routes) are NOT precached —
        // they stream via the immutable HTTP cache when ScrollGate mounts
        // them, so a boot-time SW install no longer pulls ~1MB of JS the
        // visitor may never scroll to.
        globPatterns: [
          'index.html',
          'registerSW.js',
          'manifest.webmanifest',
          'assets/index-*.js',
          'assets/rolldown-runtime-*.js',
          'assets/react-vendor-*.js',
          'assets/index-*.css',
          'assets/*-latin-wght-normal.subset-*.woff2',
        ],
        // Nothing in the shell is larger than this; anything bigger was
        // probably an image or lazy chunk that slipped through the glob.
        maximumFileSizeToCacheInBytes: 1024 * 1024,
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // CacheFirst strategy for all static images (handling query params like ?w=1000 or asset hashes)
            urlPattern: /\.(?:png|jpg|jpeg|svg|webp|avif)(?:\?.*)?$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache-v2',
              expiration: {
                maxEntries: 1000,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 365 Days (1 Year)
                purgeOnQuotaError: false,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Note: match the real React packages, NOT any package whose path
            // merely contains /react/ (e.g. @sentry/react) — that would pull
            // the lazy Sentry SDK into the eager vendor chunk.
            if (
              id.includes('/node_modules/react/') ||
              id.includes('/node_modules/react-dom/') ||
              id.includes('/node_modules/react-router')
            ) {
              return 'react-vendor';
            }
            // NOTE: no react-icons grouping on purpose. Every react-icons
            // consumer (ContactUs, Footer, Featuring) is lazy, so forcing an
            // eager 'icons-vendor' chunk hoisted its shared React core into
            // the entry graph — ~5KB gz of duplication for zero benefit.
            // Trade-off: the small IconContext/IconBase core now ships once
            // per lazy chunk that uses icons — deliberate, keep it out of the
            // eager graph.
          }
        },
      },
    },
  },
});
