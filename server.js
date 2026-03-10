#!/usr/bin/env node
/**
 * Minimal static file server for self-hosting LegacyLink.
 * Usage: node server.js [port]
 * Serves the contents of ./dist (run npm run build first).
 */

import { createServer } from "node:http";
import { readFile, realpath } from "node:fs/promises";
import { dirname, extname, join, posix, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.argv[2] || "3000", 10);
if (!Number.isFinite(PORT) || PORT < 1 || PORT > 65535) {
  console.error(`Invalid port: ${process.argv[2]}. Must be 1-65535.`);
  process.exit(1);
}
const DIST = join(__dirname, "dist");
const DIST_REALPATH = await realpath(DIST);
const DIST_PREFIX = `${DIST_REALPATH}${sep}`;

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

const SECURITY_HEADERS = {
  "Content-Security-Policy": [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "object-src 'none'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "worker-src 'self' blob:",
  ].join("; "),
  "Permissions-Policy": [
    "accelerometer=()",
    "camera=()",
    "geolocation=()",
    "gyroscope=()",
    "magnetometer=()",
    "microphone=()",
    "payment=()",
    "usb=()",
  ].join(", "),
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "0",
};

const MAX_URL_LENGTH = 2048;

function sendResponse(res, statusCode, headers = {}, body = "") {
  res.writeHead(statusCode, { ...SECURITY_HEADERS, ...headers });
  res.end(body);
}

function resolveRequestPath(urlPath) {
  return resolve(DIST, `.${urlPath}`);
}

function isPathInsideDist(filePath) {
  return filePath === DIST_REALPATH || filePath.startsWith(DIST_PREFIX);
}

function shouldServeSpaFallback(urlPath) {
  return extname(urlPath) === "";
}

async function sendSpaFallback(res) {
  try {
    const indexData = await readFile(join(DIST_REALPATH, "index.html"));
    sendResponse(res, 200, { "Content-Type": "text/html" }, indexData);
  } catch {
    sendResponse(res, 500, {}, "Internal error");
  }
}

async function handleRequest(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    sendResponse(res, 405);
    return;
  }
  let url = req.url || "/";
  if (url.length > MAX_URL_LENGTH) {
    sendResponse(res, 414);
    return;
  }
  const q = url.indexOf("?");
  if (q !== -1) url = url.slice(0, q);
  if (url === "/") url = "/index.html";
  const normalizedUrl = posix.normalize(url);

  const file = resolveRequestPath(normalizedUrl);
  if (!isPathInsideDist(file)) {
    sendResponse(res, 403);
    return;
  }

  try {
    const realFile = await realpath(file);
    if (!isPathInsideDist(realFile)) {
      sendResponse(res, 403);
      return;
    }

    const data = await readFile(realFile);
    const contentType = MIMES[extname(realFile)] || "application/octet-stream";
    sendResponse(res, 200, { "Content-Type": contentType }, data);
  } catch (err) {
    const errorCode =
      typeof err === "object" && err !== null && "code" in err && typeof err.code === "string"
        ? err.code
        : undefined;

    if (errorCode === "ENOENT" && shouldServeSpaFallback(normalizedUrl)) {
      await sendSpaFallback(res);
      return;
    }

    if (errorCode === "ENOENT") {
      sendResponse(res, 404);
      return;
    }

    if (errorCode === "EACCES") {
      sendResponse(res, 403);
      return;
    }

    sendResponse(res, 500);
  }
}

const server = createServer((req, res) => {
  void handleRequest(req, res).catch(() => {
    if (!res.headersSent) {
      sendResponse(res, 500);
    }
  });
});

server.listen(PORT, () => {
  console.log(`LegacyLink serving at http://localhost:${PORT}`);
  console.log("Open in a browser. Data is stored locally and encrypted.");
});
