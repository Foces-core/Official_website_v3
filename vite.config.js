import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import { VitePWA } from 'vite-plugin-pwa';

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
    port: 5173,
  },
  plugins: [
    react(),
    preloadFonts(),
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
        name: 'FOCES - Forum of Computer Engineering Students',
        short_name: 'FOCES',
        description:
          'Official website of FOCES (Forum of Computer Engineering Students) at College of Engineering Chengannur.',
        theme_color: '#101011',
        background_color: '#101011',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
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
      },
    }),
  ],
  assetsInclude: ['**/*.glb'],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/react-router')
            ) {
              return 'react-vendor';
            }
            if (id.includes('/swiper/')) {
              return 'swiper-vendor';
            }
            if (id.includes('/react-icons/')) {
              return 'icons-vendor';
            }
          }
        },
      },
    },
  },
});
