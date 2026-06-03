import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'nequi-qr.jpeg', 'icons.svg'],
      manifest: {
        name: 'Infinity Barber',
        short_name: 'InfinityBarber',
        description: 'Reserva tu cita en Infinity Barber',
        theme_color: '#06060a',
        background_color: '#06060a',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
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
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    proxy: {
      "/api": { target: "http://localhost:3000", changeOrigin: true },
      "/barbers": { target: "http://localhost:3000", changeOrigin: true },
      "/barber-portfolio": { target: "http://localhost:3000", changeOrigin: true },
      "/gallery": { target: "http://localhost:3000", changeOrigin: true },
      "/payments": { target: "http://localhost:3000", changeOrigin: true },
      "/clients": { target: "http://localhost:3000", changeOrigin: true },
    },
  },
})
