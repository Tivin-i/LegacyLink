# LegacyLink – Runbook for self-hosting

## Build

```bash
npm ci
npm run build
```

Output: `dist/` (static files).

## Run with Node server

```bash
node server.js [port]
```

Default port: 3000. Serves `dist/` with SPA fallback (unknown paths → `index.html`).

## Run with Docker

```bash
docker build -t legacylink .
docker run -p 80:80 legacylink
```

Uses nginx to serve `dist/`. For a custom port, e.g. 8080:

```bash
docker run -p 8080:80 legacylink
```

## Run with nginx (manual)

1. Copy contents of `dist/` to your web root (e.g. `/var/www/legacylink`).
2. Configure nginx so that the document root is that directory and `try_files $uri $uri/ /index.html;` is set for the location `/`.
3. Enable HTTPS (e.g. Let’s Encrypt). Recommended for production.

## Run with Caddy

Example Caddyfile:

```
:3000
root * /path/to/dist
file_server
try_files {path} /index.html
```

## Data and storage

- **No server-side storage.** All vault data is in the **browser** (IndexedDB) on the client.
- **Encryption:** AES-GCM; key is derived from the user’s passphrase and never sent or stored.
- **Export:** Users can download an encrypted JSON backup from the app.
- **IndexedDB limits:** Browsers typically allow hundreds of MB per origin; export is available if users need to move data.

## Browser support

- Modern browsers with Web Crypto API and IndexedDB (Chrome, Firefox, Edge, Safari).
- Passkeys require WebAuthn and PRF support (e.g. Chrome, recent Edge).

## No telemetry

The app does not send analytics or data to external servers. All operations are local.
