# LegacyLink

A self-hosted, local-first legacy documentation system. Document your self-hosted systems and how to access them so a spouse or successor can take over if needed. All data is stored in an **encrypted vault file** that you open or create when you use the app; access is with a decryption key only.

This project is coded with AI and reviewed by people.

## Features

- **File-based vault:** Open an existing vault file or create a new one (you choose where to save it). All data lives in a single encrypted file—no server, no IndexedDB.
- Encrypted vault (AES-GCM, key from passphrase via PBKDF2). Key is never stored.
- Pre-built "Legacy system" template: what is the system, how to access, passwords, locations, IPs, billing/VPS.
- Unlock with decryption key. Save a copy to another file or replace the current vault with another file.
- Self-hosted: static app, no backend, no telemetry.

## Quick start

**Development:** `npm install` then `npm run dev`

**Production:** `npm run build` then serve the `dist/` folder (e.g. nginx, or `node server.js 3000`).

**Docker:** `docker build -t legacylink .` then `docker run -p 80:80 legacylink`

## ⚠️ Do not expose to the internet

**Run LegacyLink only on localhost or on a private/local network.** Do not expose it to the public internet (e.g. do not bind to 0.0.0.0 and open your firewall, or put it behind a public URL without authentication). The app has no built-in authentication or rate limiting; it is intended for you and trusted people on your local network. Exposing it would allow anyone on the internet to serve the app and could encourage attacks or misuse of your setup.

## For successors

You need the **decryption key** (and the same app URL or self-hosted instance). Open the app, choose **Import vault**, select the vault file, enter the key, unlock. Use **Vault file** (in the app) to save a copy or open another vault. See docs/HANDOVER.md for a short guide.

## Tech

React 18, TypeScript, Vite, Web Crypto API, File System Access API (with fallback for file input / download).
