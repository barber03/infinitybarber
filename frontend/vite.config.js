import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
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
