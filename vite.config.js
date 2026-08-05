// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react-swc'

// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [react()],
//   assetsInclude: ['**/*.glb'],
// })


import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.glb'],
  optimizeDeps: {
    include: ['@sanity/client'],
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'three-vendor': ['three'],
          'swiper-vendor': ['swiper'],
          'icons-vendor': ['react-icons'],
          'sanity-vendor': ['@sanity/client'],
        },
      },
    },
  },
});
