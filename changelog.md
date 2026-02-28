# Changelog

All notable changes to LegacyLink are documented here.

## [Unreleased]

### Added

- **Unlock / Store**
  - When no store exists locally, user can choose: **Create new LegacyLink Store** (then set a new decryption key and confirm) or **Open existing LegacyLink Store** (select exported file, then enter decryption key; key is verified before importing).
  - New store creation persists an empty encrypted vault and unlocks in one step; opening existing store decrypts the file to verify the key, then saves to local storage and unlocks.

- **Architecture**
  - `docs/ARCHITECTURE-REVIEW.md`: architecture review summary and refactor log (layer alignment, coupling, duplication, testability, refactors applied).

### Fixed

- **New entry**
  - Creating a new entry no longer shows "Entry not found." after save. Entry creation now uses a single `createEntry(templateId, title, sections)` so the new entry is written and persisted in one vault update (fixes race with previous addEntry + updateEntry flow).

### Changed (refactor / cleanup)

- **Shared crypto**: `validateStoredEncryptedBlob(value)` and `readStoredBlobFromFile(file)` in `vault-crypto.ts`; UnlockPage and ExportImportPage use them for consistent file validation.
- **Shared styles**: `forms.formColumn`, `forms.formActionsRow`, `forms.fileInputHidden`, `forms.labelBlock` in `shared.ts`; UnlockPage and ExportImportPage use them.
- **Passkey hook**: `usePasskeyAvailable()` in `hooks/usePasskeyAvailable.ts`; UnlockPage and ExportImportPage use it instead of duplicating the supported+configured effect.
- **TemplateForm**: `onSave` is optional; callers can omit it. Error-state “Back to list” uses `links.back` on EntryDetailPage and NewEntryPage.
- **EntryDetailPage**: Section headings use `typography.h2`. Comments added for `addEntry` (VaultContext) and `getAllTemplates` (templates).
- **TypeScript**: `tsconfig` includes `@testing-library/jest-dom/vitest` so test matchers type-check.

### Testing

- **vault-service** (`src/vault/vault-service.test.ts`): Tests for `unlockVault` (no store, with store, wrong key), `saveVault`, `createAndSaveEmptyVault`, `importVaultFromBlob`, `createEmptyEntry`. Storage layer mocked with in-memory blob.
- **VaultContext** (`src/context/VaultContext.test.tsx`): Tests for `hasExistingStore`, `createNewStore`, `createEntry` + `getEntry`, and `unlock` when store exists. Includes cleanup to avoid duplicate DOM across tests.
- **UnlockPage** (`src/pages/UnlockPage.test.tsx`): Tests for no-store choice (Create new / Open existing), create-key form, creating store with matching keys and navigation, unlock form when store exists, unlock with correct key and navigation.
- **NewEntryPage** (`src/pages/NewEntryPage.test.tsx`): Smoke tests that page renders with "New entry" and Create button and uses `createEntry` from context.

### Changed

- **Refactor (architecture)**
  - Shared base64 encoding/decoding in `src/utils/base64.ts`; `vault-crypto` and `auth/passkey` now use it (removed duplication).
  - Vault context no longer exposes `passphraseRef`. New methods: `exportVault()`, `importVault(stored)`, `registerPasskey()` so export/import/passkey registration use the vault layer only.
  - Shared UI styles in `src/styles/shared.ts`; pages and `TemplateForm` use shared layout, links, typography, buttons, forms, and messages for consistency and DRY.

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
