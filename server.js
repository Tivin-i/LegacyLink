#!/usr/bin/env node
/**
 * Minimal static file server for self-hosting LegacyLink.
 * Usage: node server.js [port]
 * Serves the contents of ./dist (run npm run build first).
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = parseInt(process.argv[2] || "3000", 10);
if (!Number.isFinite(PORT) || PORT < 1 || PORT > 65535) {
  console.error(`Invalid port: ${process.argv[2]}. Must be 1-65535.`);
  process.exit(1);
}
const DIST = path.join(__dirname, "dist");

const MIMES = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
};

/** Security headers applied to every response. */
const SECURITY_HEADERS = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; " +
    "object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';",
};

const MAX_URL_LENGTH = 2048;

const server = http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, SECURITY_HEADERS);
    res.end();
    return;
  }
  let url = req.url || "/";
  if (url.length > MAX_URL_LENGTH) {
    res.writeHead(414, SECURITY_HEADERS);
    res.end();
    return;
  }
  const q = url.indexOf("?");
  if (q !== -1) url = url.slice(0, q);
  if (url === "/") url = "/index.html";
  const file = path.join(DIST, path.normalize(url).replace(/^(\.\.(\/|\\))+/, ""));
  if (!file.startsWith(DIST)) {
    res.writeHead(403, SECURITY_HEADERS);
    res.end();
    return;
  }
  fs.realpath(file, (rpErr, resolved) => {
    if (rpErr || !resolved.startsWith(DIST)) {
      if (rpErr && rpErr.code === "ENOENT") {
        fs.readFile(path.join(DIST, "index.html"), (e2, indexData) => {
          if (e2) {
            res.writeHead(500, SECURITY_HEADERS);
            res.end("Internal error");
            return;
          }
          res.writeHead(200, { ...SECURITY_HEADERS, "Content-Type": "text/html" });
          res.end(indexData);
        });
        return;
      }
      res.writeHead(403, SECURITY_HEADERS);
      res.end();
      return;
    }
    fs.readFile(resolved, (err, data) => {
      if (err) {
        res.writeHead(500, SECURITY_HEADERS);
        res.end();
        return;
      }
      const ext = path.extname(resolved);
      const contentType = MIMES[ext] || "application/octet-stream";
      res.writeHead(200, { ...SECURITY_HEADERS, "Content-Type": contentType });
      res.end(data);
    });
  });
});

server.listen(PORT, () => {
  console.log(`LegacyLink serving at http://localhost:${PORT}`);
  console.log("Open in a browser. Data is stored locally and encrypted.");
});
