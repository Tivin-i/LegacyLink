# LegacyLink

A self-hosted, local-first legacy documentation system. Document your self-hosted systems and how to access them so a spouse or successor can take over if needed. All data is stored locally in your browser and encrypted; access is with a decryption key or optional passkey.

This project is coded with AI and reviewed by people.

## Features

- Encrypted vault (AES-GCM, key from passphrase via PBKDF2). Key is never stored.
- Pre-built "Legacy system" template: what is the system, how to access, passwords, locations, IPs, billing/VPS.
- Unlock with decryption key or optional WebAuthn passkey.
- Export/import encrypted backup file.
- Self-hosted: static app, no backend, no telemetry.

## Quick start

**Development:** `npm install` then `npm run dev`

**Production:** `npm run build` then serve the `dist/` folder (e.g. nginx, or `node server.js 3000`).

**Docker:** `docker build -t legacylink .` then `docker run -p 80:80 legacylink`

## For successors

You need the decryption key (and the same app URL or self-hosted instance). Open the app, enter the key, unlock. Use Export/Import to download a backup. See docs/HANDOVER.md for a short guide.

## Tech

React 18, TypeScript, Vite, IndexedDB (idb), Web Crypto API, WebAuthn (passkey with PRF).
