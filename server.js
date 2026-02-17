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

const server = http.createServer((req, res) => {
  let url = req.url || "/";
  const q = url.indexOf("?");
  if (q !== -1) url = url.slice(0, q);
  if (url === "/") url = "/index.html";
  const file = path.join(DIST, path.normalize(url).replace(/^(\.\.(\/|\\))+/, ""));
  if (!file.startsWith(DIST)) {
    res.writeHead(403);
    res.end();
    return;
  }
  fs.readFile(file, (err, data) => {
    if (err) {
      if (err.code === "ENOENT") {
        fs.readFile(path.join(DIST, "index.html"), (e2, indexData) => {
          if (e2) {
            res.writeHead(500);
            res.end("Internal error");
            return;
          }
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(indexData);
        });
        return;
      }
      res.writeHead(500);
      res.end();
      return;
    }
    const ext = path.extname(file);
    const contentType = MIMES[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`LegacyLink serving at http://localhost:${PORT}`);
  console.log("Open in a browser. Data is stored locally and encrypted.");
});
