import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use root path for Cloudflare Pages, subdirectory for GitHub Pages
  // Set VITE_BASE_PATH environment variable to override (e.g., for GitHub Pages)
  base: process.env.VITE_BASE_PATH || '/',
})
