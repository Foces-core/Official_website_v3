// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react-swc'

// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [react()],
//   assetsInclude: ['**/*.glb'],
// })


import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    // Compress every image at build time (smaller payloads for everyone,
    // especially low-end devices on slow connections)
    ViteImageOptimizer({
      jpg: { quality: 72 },
      jpeg: { quality: 72 },
      png: { quality: 75 },
      webp: { quality: 75 },
      avif: { quality: 60 },
    }),
    // PWA: caches the app shell + images so repeat visits are near-instant,
    // even on very slow connections. No offline mode required.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['foces.svg', 'og-image.jpg', 'pwa-192.png', 'pwa-512.png'],
      manifest: {
        name: 'FOCES - Forum of Computer Engineering Students',
        short_name: 'FOCES',
        description: 'Official website of FOCES (Forum of Computer Engineering Students) at College of Engineering Chengannur.',
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
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,jpeg,webp,avif,woff2}'],
        // Keep the precache lean: skip the 734KB three.js chunk (only the
        // desktop hero WebGL needs it, and only on good connections) and the
        // non-latin font subsets (the latin site never downloads them).
        globIgnores: [
          '**/three.module-*.js',
          '**/inter-{latin-ext,cyrillic,cyrillic-ext,greek,greek-ext,vietnamese}-*.woff2',
          '**/space-grotesk-{latin-ext,vietnamese}-*.woff2',
        ],
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
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'swiper-vendor': ['swiper'],
          'icons-vendor': ['react-icons'],
        },
      },
    },
  },
});
