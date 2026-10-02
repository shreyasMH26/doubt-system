import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Render deploys root or uses RENDER env var; support root by default on custom domains / Render
  base: process.env.RENDER ? '/' : (process.env.VITE_BASE_PATH || '/'),
  preview: {
    host: '0.0.0.0',
    port: 4173,
    // Safely allow Render assigned domains (*.onrender.com), localhost, and any custom domain passed via env
    allowedHosts: [
      '.onrender.com',
      'localhost',
      ...(process.env.RENDER_EXTERNAL_HOSTNAME ? [process.env.RENDER_EXTERNAL_HOSTNAME] : []),
      ...(process.env.ALLOWED_HOST ? [process.env.ALLOWED_HOST] : [])
    ]
  }
})
