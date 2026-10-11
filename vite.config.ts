import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { VitePWA } from 'vite-plugin-pwa';

// `SINGLE=1 npm run build` menghasilkan satu fail HTML (mudah dikongsi tanpa pelayan, tanpa PWA).
const single = process.env.SINGLE === '1';

export default defineConfig({
  plugins: [
    react(),
    ...(single
      ? [viteSingleFile()]
      : [
          VitePWA({
            registerType: 'autoUpdate',
            injectRegister: 'auto',
            includeAssets: ['icon.svg', 'apple-touch-icon.png'],
            manifest: {
              id: './',
              name: 'Kembara Muzika',
              short_name: 'Kembara Muzika',
              description: 'Pengembaraan Muzik secara Digital — permainan 3D teori muzik.',
              lang: 'ms',
              start_url: './',
              scope: './',
              display: 'fullscreen',
              display_override: ['fullscreen', 'standalone'],
              orientation: 'any',
              background_color: '#1e1b4b',
              theme_color: '#1e1b4b',
              categories: ['education', 'games', 'music'],
              icons: [
                { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
                { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
                { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
              ],
            },
            workbox: {
              globPatterns: ['**/*.{js,css,html,woff,woff2,png,svg}'],
              maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
              navigateFallback: 'index.html',
            },
          }),
        ]),
  ],
  base: './',
  build: {
    chunkSizeWarningLimit: 2500,
    outDir: single ? 'dist-single' : 'dist',
  },
});
