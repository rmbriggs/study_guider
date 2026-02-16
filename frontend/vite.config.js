import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// Resolve certs from config location so it works regardless of cwd
const certsDir = path.resolve(__dirname, 'certs')
const keyPath = path.join(certsDir, 'key.pem')
const certPath = path.join(certsDir, 'cert.pem')
const useTrustedCerts = fs.existsSync(keyPath) && fs.existsSync(certPath)

if (useTrustedCerts) {
  console.log('[vite] Using trusted mkcert certificates for https://localhost:5173')
} else {
  console.log('[vite] No mkcert certs in frontend/certs/ - using self-signed (browser will warn)')
}

export default defineConfig({
  plugins: [react(), ...(useTrustedCerts ? [] : [basicSsl()])],
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
})
