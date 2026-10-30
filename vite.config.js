import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from "path"
import { readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'logo.png', 'logo-dark.png'],
      manifest: {
        name: 'Mecánica Pistón',
        short_name: 'Pistón',
        description: 'Gestión de taller mecánico',
        theme_color: '#000000',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        // Pre-cache: se incluyen automáticamente todos los assets del build
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        
        // Runtime caching: estrategias para requests dinámicos.
        // Las consultas a la API de Supabase (/rest/v1) no se cachean acá: el
        // modo offline lo resuelve IndexedDB, y una respuesta vieja servida por
        // el service worker se tomaría como dato actual del servidor.
        runtimeCaching: [
          {
            // Supabase Storage (imágenes y PDFs): CacheFirst
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-storage-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 días
              },
              // Solo respuestas OK. Las imágenes se piden con crossOrigin para
              // que la respuesta no sea opaca: así un error (por ejemplo, una
              // URL vencida) no queda guardado como si fuera la foto.
              cacheableResponse: {
                statuses: [200],
              },
              plugins: [
                {
                  // Las URLs firmadas traen un `token` distinto cada vez que se
                  // generan. Se guardan en caché sin él, así una foto ya vista
                  // se sigue mostrando offline aunque su URL haya vencido.
                  cacheKeyWillBeUsed: async ({ request }) => {
                    const url = new URL(request.url);
                    url.searchParams.delete('token');
                    return url.href;
                  },
                },
              ],
            },
          },
          {
            // Google Fonts: CacheFirst
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 año
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],

        // Fallback a index.html para navegación SPA offline
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api/],
      },
    })
  ],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
