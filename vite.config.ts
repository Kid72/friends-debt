/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

function getManifestJson(room?: string | null) {
  const startUrl = room ? `/?room=${encodeURIComponent(room)}` : '/';
  return JSON.stringify({
    name: 'Dostlar Xərcləri & Borclar',
    short_name: 'DostBorc',
    description: 'Dostlar üçün xərc və borc hesablama PWA',
    start_url: startUrl,
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F4FAF8',
    theme_color: '#006A60',
    icons: [
      {
        src: '/pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      },
      {
        src: '/pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ]
  });
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'dynamic-manifest-server',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && (req.url.startsWith('/api/manifest') || req.url.startsWith('/manifest.webmanifest'))) {
            const url = new URL(req.url, 'http://localhost');
            const room = url.searchParams.get('room');
            res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache');
            res.end(getManifestJson(room));
            return;
          }
          next();
        });
      },
      configurePreviewServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && (req.url.startsWith('/api/manifest') || req.url.startsWith('/manifest.webmanifest'))) {
            const url = new URL(req.url, 'http://localhost');
            const room = url.searchParams.get('room');
            res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache');
            res.end(getManifestJson(room));
            return;
          }
          next();
        });
      }
    },
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: false,
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg', 'favicon.svg', 'manifest.webmanifest']
    })
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts'
  }
});
