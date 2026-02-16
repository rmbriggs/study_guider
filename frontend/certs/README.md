# Local HTTPS certificates (optional)

To get rid of the browser’s “your connection is not private” / “steal your information” warning for https://localhost:5173, use trusted local certificates with **mkcert**.

## One-time setup

1. **Install mkcert**
   - Windows (Chocolatey): `choco install mkcert`
   - Or download from: https://github.com/FiloSottile/mkcert#installation

2. **Install the local CA** (once per machine):
   ```bash
   mkcert -install
   ```

3. **Generate certs** (from the `frontend` folder):
   ```bash
   cd frontend
   mkcert -key-file certs/key.pem -cert-file certs/cert.pem localhost 127.0.0.1
   ```

4. Restart the dev server (`npm run dev`). Vite will use these certs and the browser will treat the site as secure with no warning.

If the `certs/` folder or the `.pem` files don’t exist, the dev server falls back to a self-signed cert (you’ll still see the browser warning).
