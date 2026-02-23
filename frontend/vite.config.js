import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// Resolve certs from config location so it works regardless of cwd
const certsDir = path.resolve(__dirname, 'certs')
const keyPath = path.join(certsDir, 'key.pem')
const certPath = path.join(certsDir, 'cert.pem')

// Only use HTTPS in local development. On Railway (NODE_ENV=production) always
// serve plain HTTP — Railway's load balancer handles SSL termination.
const isProduction = process.env.NODE_ENV === 'production'
const useTrustedCerts = !isProduction && fs.existsSync(keyPath) && fs.existsSync(certPath)

if (!isProduction) {
  if (useTrustedCerts) {
    console.log('[vite] Using trusted mkcert certificates for https://localhost:5173')
  } else {
    console.log('[vite] No mkcert certs in frontend/certs/ - running on plain HTTP (localhost:5173)')
  }
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    ...(useTrustedCerts && {
      https: {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      },
    }),
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  // Production preview server: plain HTTP, bind to all interfaces.
  // On Railway, proxy /api to the backend (internal URL so browser stays on same origin).
  preview: {
    host: true,
    https: false,
    allowedHosts: ['www.coursemind.app', 'coursemind.app'],
    proxy: {
      '/api': {
        target: process.env.RAILWAY_BACKEND_URL || 'http://unique-mindfulness.railway.internal',
        changeOrigin: true,
      },
    },
  },
})
