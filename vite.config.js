import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import { VitePWA } from 'vite-plugin-pwa';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { imagetools } from 'vite-imagetools';

const PORT = 5173;

// The hero PNG is the LCP element. It only mounts after React renders, so
// without a hint its fetch waits for the JS bundle — on 3G that's seconds.
// Preload it in the built HTML so the (tiny) request starts at parse time,
// overlapping the JS download; React then paints it from cache instantly.
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
      const link = `<link rel="preload" as="image" type="image/png" href="/${heroPath}" fetchpriority="high" />`;
      return html.replace('</head>', `    ${link}\n  </head>`);
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
        .filter((n) => /-(latin)-wght-normal-.*\.woff2$/.test(n))
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
    // imagetools: generates LQIP placeholders and responsive variants at build time.
    // Import params like ?blur=20&w=20 to get a tiny blurred data-URL.
    imagetools(),
    // Sentry: upload source maps in CI/release builds so stack traces are
    // readable. The DSN is read from VITE_SENTRY_DSN env var at runtime.
    ...(process.env.VITE_SENTRY_DSN
      ? [
          sentryVitePlugin({
            org: process.env.SENTRY_ORG,
            project: process.env.SENTRY_PROJECT,
            authToken: process.env.SENTRY_AUTH_TOKEN,
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
        // Shell only — photos ship via the immutable HTTP cache instead.
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        // Keep the precache lean: skip the 734KB three.js chunk (only the
        // desktop hero WebGL needs it, and only on good connections) and the
        // non-latin font subsets (the latin site never downloads them).
        globIgnores: [
          '**/three.module-*.js',
          '**/inter-{latin-ext,cyrillic,cyrillic-ext,greek,greek-ext,vietnamese}-*.woff2',
          '**/space-grotesk-{latin-ext,vietnamese}-*.woff2',
        ],
        // Nothing in the shell is larger than this; anything bigger was
        // probably an image that slipped through the glob.
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
