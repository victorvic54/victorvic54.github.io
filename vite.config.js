import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // For GitHub Pages user/organization site (victorvic54.github.io)
  build: {
    rollupOptions: {
      // Multi-page build: the arcade lives at /games/ as its own entry so
      // GitHub Pages can serve it as a real path without a client router.
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        games: fileURLToPath(new URL('./games/index.html', import.meta.url))
      }
    }
  }
})
