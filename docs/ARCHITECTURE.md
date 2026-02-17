# LegacyLink Architecture

## Overview

LegacyLink is a self-hosted, local-first legacy documentation system. All data is stored locally in the browser (IndexedDB) and encrypted at rest. Access is via a decryption key or optional WebAuthn passkey. No backend is required for core operation.

## High-Level Architecture

```
Client SPA (React + TypeScript)
├── UI Layer (Unlock, List, Entry detail, Template form)
├── Vault Logic (session, CRUD, export/import)
├── Crypto Layer (KDF, AES-GCM, key in memory only)
├── Auth (passkey registration/auth)
└── Storage (IndexedDB + encrypted file format)
```

## Data Model

### Vault

- Single logical vault per origin (browser).
- Persisted as one encrypted blob in IndexedDB: `vault` store, key `vault`, value `{ iv, ciphertext, salt }`.
- In memory after unlock: plaintext JSON `VaultData = { entries: Entry[], version: number }`.

### Entry

- One filled template instance (one documented system).
- `id`: UUID v4
- `templateId`: string (e.g. `"legacy-system"`)
- `title`: string (user-facing name)
- `updatedAt`: ISO 8601 string
- `sections`: record of section id → section data (template-defined shape)

### Template Schema

- `id`: string
- `name`: string
- `sections`: array of `{ id, label, fields: Field[] }`
- `Field`: `{ id, label, type: 'text'|'textarea'|'password'|'url'|'email'|'number'|'date', required?: boolean }`

## Crypto Design

- **Algorithm**: AES-GCM (256-bit key), 96-bit IV (random per encrypt).
- **Key derivation**: PBKDF2-HMAC-SHA256 from user passphrase; salt 128-bit random, stored with ciphertext; 600_000 iterations (OWASP 2023).
- **Key lifecycle**: Derived on unlock; held in memory only; never persisted. Lock clears key and in-memory vault.
- **Passkey (optional)**: WebAuthn authenticator used to decrypt a wrapped key stored in IndexedDB (wrapped with a key derived from passkey assertion). Successor can use passkey or passphrase.

## Storage

- **IndexedDB** (via idb): DB name `legacylink-v1`, store `vault` for encrypted blob; store `meta` for wrapped passkey material and version/salt if needed.
- **Export file**: JSON `{ version: 1, salt, iv, ciphertext }` (same as stored blob) or single-entry variant; user downloads file, can re-import on same or another device.

## Security Assumptions

- Origin isolation: vault tied to app origin.
- No telemetry; no network for core flows.
- Successor access: passphrase (or written recovery) is primary; passkey optional for convenience.
