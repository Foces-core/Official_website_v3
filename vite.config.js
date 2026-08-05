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
  ],
  assetsInclude: ['**/*.glb'],
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'swiper-vendor': ['swiper'],
          'icons-vendor': ['react-icons'],
        },
      },
    },
  },
});
