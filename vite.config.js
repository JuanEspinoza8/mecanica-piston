import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from "path"

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
        
        // Runtime caching: estrategias para requests dinámicos
        runtimeCaching: [
          {
            // API calls a Supabase: NetworkFirst con fallback a cache
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 días
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
              networkTimeoutSeconds: 5,
            },
          },
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
              cacheableResponse: {
                statuses: [0, 200],
              },
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
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
