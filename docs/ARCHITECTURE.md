# LegacyLink Architecture

## Overview

LegacyLink is a self-hosted, local-first legacy documentation system. All data is stored in a **single encrypted vault file** that the user opens or creates when they use the app. There is no server-side storage and no IndexedDB; the vault file is the only persistence. Access is via decryption key only. No backend is required for core operation.

## High-Level Architecture

```
Client SPA (React + TypeScript)
├── UI Layer (Unlock, List, Entry detail, Template form)
├── Vault Logic (session, CRUD, file read/write)
├── Crypto Layer (KDF, AES-GCM, key in memory only)
└── Storage (file-based: single encrypted vault file)
```

## Data Model

### Vault

- One vault per opened file. The app does not remember the file across sessions; on each load the user chooses **Import vault** or **Create a new one**.
- **Vault file format:** A single JSON file containing one `StoredEncryptedBlob` (`{ version, salt, iv, ciphertext }`). The decrypted plaintext is `{ format: 2, current, versions, versionHistoryLimit }` where `current` is the live vault state and `versions` is an array of past snapshots (trimmed to `versionHistoryLimit` on each save).
- In memory after unlock: plaintext `VaultData` (current state) plus optional `lastPayload` for version history and save logic.

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

## Storage

- **File-based only.** No IndexedDB. The vault is read/written via:
  - **Read:** `readVaultFromFile(file, passphrase)` or `readVaultFromHandle(handle, passphrase)` → decrypt entire file → `DecryptedVaultPayload`.
  - **Write:** `writeVaultToHandle(handle, passphrase, payload)` → encrypt full payload → write to file.
- **File System Access API** is used when available (`showSaveFilePicker`, `showOpenFilePicker`); fallback to `<input type="file">` for open and download for save.
- **Export / backup:** User can "Save a copy as…" (save picker) or "Download backup" to get an encrypted JSON file; same format as the vault file.

## Security Assumptions

- Origin isolation: vault tied to app origin when opened.
- No telemetry; no network for core flows.
- Successor access: passphrase (or written recovery) is the only way to unlock; keep the key and vault file in a safe place.
