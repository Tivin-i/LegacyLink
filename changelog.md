# Changelog

All notable changes to LegacyLink are documented here.

## [Unreleased]

### Added

- **Repository**
  - `scripts/commit.sh` wrapper for maintainers to commit as LegacyLink AI (author and committer).

- **Documentation**
  - README now states that the project is coded with AI and reviewed by people.

- **Repository**
  - Git repository initialized with `main` as default branch.
  - `.gitignore` added (node_modules, dist, env, IDE, OS files).
  - Initial commit with full project (vault, templates, docs, Docker, tests).

## [0.1.0] – 2025-02-09

### Added

- **Vault and encryption**
  - Unlock with decryption key (passphrase); key derived with PBKDF2-HMAC-SHA256 (600k iterations), vault encrypted with AES-GCM.
  - Key is never stored; session stays unlocked in memory until lock.
  - Lock button and redirect to unlock screen when locked.

- **Storage**
  - Local-only vault in IndexedDB (idb); single encrypted blob per origin.
  - Export vault as encrypted JSON file; import from file (same key required).

- **Templates and entries**
  - Pre-built "Legacy system" template with sections: What is the system, How to access, Passwords and access details, Locations, IPs and networking, Billing / VPS / credit card.
  - Multiple entries; list view with title, template name, updated date.
  - Create, edit, delete entries; view entry detail with all sections.

- **Passkey (optional)**
  - Register passkey when vault is unlocked (Export / Import page); uses WebAuthn with PRF to store encrypted passphrase.
  - Unlock with passkey from the unlock screen when a passkey is registered.
  - Requires browser support for WebAuthn and PRF extension.

- **Self-hosting**
  - Static SPA build (Vite + React); no backend required.
  - Docker image (nginx) to serve the app.
  - Optional Node static server (`server.js`) for local or simple deployment.
  - Documentation: README, RUNBOOK (self-hosting), HANDOVER (for successors).

- **UX**
  - Unlock page, entry list, entry detail, new entry form, export/import page.
  - Accessible forms and focus states; basic mobile-friendly layout.
  - No telemetry; no external requests for core flows.

### Security

- All vault data encrypted at rest (AES-GCM).
- Decryption key never persisted; passkey material stored encrypted (PRF-derived key).
- No hardcoded secrets; no server-side storage of user data.
