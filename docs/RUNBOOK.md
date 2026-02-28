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

- **No server-side storage.** All vault data is in a **vault file** that the user opens or creates in the browser. The app does not store the vault on the server; the file lives on the user’s device (or wherever they save it).
- **Encryption:** AES-GCM; key is derived from the user’s passphrase and never sent or stored.
- **Export / backup:** Users can "Save a copy as…" (save picker) or "Download backup" to get an encrypted JSON file. They can "Open another vault" to replace the current vault with another file.

## Browser support

- Modern browsers with Web Crypto API (Chrome, Firefox, Edge, Safari).
- File System Access API is used when available (e.g. Chrome, Edge) for "Save a copy as…" and choosing where to save new vaults; otherwise the app falls back to file input and download.

## No telemetry

The app does not send analytics or data to external servers. All operations are local.
