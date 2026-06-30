import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // O banner de atualização (PWAManager) controla o reload — não atualiza sozinho
      // no meio de um formulário aberto.
      registerType: 'prompt',
      // Registramos o SW via virtual:pwa-register/react no PWAManager; evita registro duplo.
      injectRegister: false,
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'logo.svg'],
      manifest: {
        name: 'HospedaBR — Gestão de Hospedagens',
        short_name: 'HospedaBR',
        description:
          'Gestão de hospedagens multi-canal: reservas, propriedades, calendário e financeiro.',
        lang: 'pt-BR',
        dir: 'ltr',
        theme_color: '#1E3A5F',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'any',
        scope: '/',
        start_url: '/dashboard',
        categories: ['business', 'productivity', 'travel'],
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          { name: 'Reservas', short_name: 'Reservas', url: '/dashboard/bookings' },
          { name: 'Calendário', short_name: 'Calendário', url: '/dashboard/bookings/calendar' },
          { name: 'Nova acomodação', short_name: 'Nova', url: '/dashboard/properties/new' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
        // SPA: rotas do client caem no index.html (cacheado), mas nunca a API.
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        // recharts + react podem gerar chunks > 2 MiB (limite padrão); eleva p/ caber no precache.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        runtimeCaching: [
          // Fontes do Google (Inter) — carregadas via @import no index.css.
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Imagens (avatares, fotos de propriedade) — CacheFirst com expiração.
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // IMPORTANTE: respostas de /api NÃO são cacheadas de propósito — app multi-tenant
          // (financeiro/reservas); um cache por-URL poderia servir dados de outro tenant offline.
        ],
      },
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: 'index.html',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5283',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
