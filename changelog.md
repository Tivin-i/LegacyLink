# Changelog

All notable changes to LegacyLink are documented here.

## [Unreleased]

## [0.1.1] – 2026-02-28

### Security

- **Base64 and large vaults:** Encoding uses chunked processing so large ciphertext (e.g. big exports) no longer hits engine argument limits or causes RangeError.
- **Vault file size limit:** Import and open reject vault files larger than 50 MB to prevent memory exhaustion (constant `MAX_VAULT_FILE_BYTES` in `src/crypto/constants.ts`).
- **Passphrase retention:** Passphrase is cleared in UnlockPage state after successful unlock and overwritten in VaultContext on lock to reduce time in memory.
- **Decrypt error uniformity:** Wrong passphrase and invalid/corrupt vault format now throw the same generic error message to avoid timing-based information leakage.

### Fixed

- **Save failure visibility:** `addEntry` now logs vault save failures to the console instead of failing silently.

### Added

- **Optional: Vault file UX and version restore**
  - **Save a copy as…:** Export/Import page (now titled "Vault file") uses "Save a copy as…" with File System Access API save picker when available; fallback to "Download backup". Section "Open another vault" replaces current vault with another file.
  - **Version restore:** Settings shows "History of versions" when version history exists; user can restore a past snapshot (it becomes current and is saved).
  - **File size indicator:** Settings shows approximate vault file size (~X KB) under "Versions to keep".

### Changed

- **Documentation updated** to reflect file-based vault and removal of passkey/IndexedDB: README.md, docs/ARCHITECTURE.md, docs/ARCHITECTURE-REVIEW.md, docs/HANDOVER.md, docs/RUNBOOK.md. Handover guide now describes opening the vault file and decryption key only; no passkey. Runbook describes file-based storage and browser support (File System Access API with fallback).
- **README:** Added warning to not expose LegacyLink to the internet; run only on localhost or a private/local network.

## [0.1.0] – 2026-02-28

### Added

- **File-based vault and index flow (Phase 4)**
  - **Passkey and IndexedDB removed:** Passkey support and `src/auth/passkey.ts` removed (passkey required cleartext meta outside the encrypted blob). IndexedDB layer removed: `src/storage/db.ts` deleted; all persistence is file-based via `file-vault-storage.ts`. Deprecated vault-service functions `unlockVault`, `saveVault`, `createAndSaveEmptyVault` removed. Export/Import page no longer shows passkey section; intro copy updated to "Backup your vault or replace it with a previously exported file." Dependency `idb` removed from package.json.

- **File-based vault and index flow (Phases 1–3)**
  - **Index flow:** App always opens to a choice screen: **Import vault** or **Create a new one**. No local store is loaded on startup; user must import a vault file or create a new one and choose where to save it (File System Access API `showSaveFilePicker` / `showOpenFilePicker`, with file input fallback for import).
  - **Single vault file:** All data is stored in one encrypted file. File format is a single `StoredEncryptedBlob`; plaintext payload is `{ format: 2, current, versions, versionHistoryLimit }`. Legacy single-VaultData export files are supported (treated as `{ current, versions: [], versionHistoryLimit: 10 }` on first open).
  - **File storage layer:** [src/storage/file-vault-storage.ts](src/storage/file-vault-storage.ts): `readVaultFromFile`, `readVaultFromHandle`, `writeVaultToHandle`, `buildPayloadForSave` (push previous current into versions and trim to limit). [src/crypto/vault-crypto.ts](src/crypto/vault-crypto.ts): `encryptPayload` / `decryptPayload` for full payload.
  - **Version history:** Each save pushes the previous state into a `versions` array and trims to a configurable limit. [VaultData](src/vault-types.ts) and payload include `versionHistoryLimit` (default 10).
  - **Settings – Vault file:** Settings page has a **Vault file** section: **Versions to keep** (0–100) with a warning that more versions increase file size. Value is stored in the encrypted payload only.
  - **Types:** [DecryptedVaultPayload](src/vault-types.ts); [src/types/file-system-access.d.ts](src/types/file-system-access.d.ts) for `showSaveFilePicker` / `showOpenFilePicker` and handle types.

- **Versioning**
  - Project version in `package.json` (current 0.0.2). Scripts: `npm run version:patch`, `version:minor`, `version:major` (bump version, update changelog; script prints git tag and push commands). GitHub Actions **Release** workflow creates a GitHub Release when a `v*` tag is pushed. Cursor rule `.cursor/rules/versioning.mdc` for maintaining and bumping versions with every update (semver: patch = fixes/docs, minor = features, major = breaking).
- **Settings and AKA**
  - **Settings page** at `/settings`: set your AKA (nickname). Stored in vault as `userAka` (vault version 4 with migration). Sidebar link "Settings" under Emergency Protocols.
  - Entry detail DocMeta "Author" shows "Admin aka {userAka}" when set; otherwise "Admin".
- **Delete confirmation**
  - **ConfirmDeleteModal**: user must type the resource name to confirm deletion. Used for deleting systems (entries), categories, and keys/certificates. Styled overlay and card; Delete button disabled until the typed name matches.
- **Store flow and Add Passkey (plan phases 1–2)**
  - **Store flow (1.1):** UnlockPage choice "Create a new LegacyLink Store"; create-key screen heading "Create a new decryption key for this store" so the two steps are explicit.
  - **Store flow (1.2):** Open existing store: submit button shows "Verifying key…" while verifying decryption key (replacing "Checking…").
  - **Add a Passkey (2):** Export/Import page uses "Add a Passkey" as primary label (button, aria-label, loading "Adding…"); when registered, "A passkey is added for this vault." Unlock page shows hint: "After unlocking, open Export / Import to add a passkey for easier unlock."
- **Categories (plan phase 3)**
  - **Data model:** `Category { id, name }`, `VaultData.categories`, optional `Entry.categoryId`. Vault version 2 with migration for existing vaults.
  - **Categories page** at `/categories`: list, add, rename, delete (delete only when no entries use the category). Sidebar link under Emergency Protocols.
  - **Entry form:** Category dropdown on New Entry and Edit (TemplateForm); createEntry/updateEntry accept optional categoryId.
  - **Entry list:** Category shown per entry; filter dropdown (All / Uncategorized / per category).
- **Markdown support (plan phase 8)**
  - **react-markdown** and **remark-gfm** for rendering markdown. **MarkdownContent** component with `.markdown-content` styling.
  - **DataBlock** row value type extended to `string | ReactNode`. Entry detail: **textarea** section values rendered as Markdown; passwords and non-textarea fields unchanged.
- **For Successors (plan phase 4)**
  - **Data model:** `VaultData.successorGuide` (optional string). Vault version 3 with migration.
  - **SuccessorGuidePage** at `/successor-guide`: view and edit the successor guide (Markdown supported). Sidebar link "For Successors".
- **History (plan phase 5)**
  - **Data model:** `VaultData.history: HistoryEntry[]` (at, action, entryId?, entryTitle?, summary?). Capped at 500 entries. Actions: store_created, vault_imported, entry_created, entry_updated, entry_deleted.
  - **Recording:** History appended on createNewStore, createEntry, updateEntry, deleteEntry, importVault, importExistingStore.
  - **HistoryPage** at `/history`: read-only list (newest first). Sidebar link "History".
- **Print / PDF (plan phase 6)**
  - **PrintViewPage** at `/print`: full vault (For Successors + all entries). "Print / Save as PDF" button; browser Print → Save as PDF. Warning that printed/PDF content is unencrypted.
  - **Print CSS:** `@media print` hides header, sidebar, context panel; `.no-print` for back/print toolbar. Entry list and Export/Import: "Print vault" link.
- **Keys & certificates (plan phase 7)**
  - **Data model:** `VaultData.uploadedKeys: UploadedKey[]` (id, name, type ssh|cert, contentBase64, uploadedAt). Stored encrypted with vault.
  - **KeysPage** at `/keys`: list uploaded keys (name, type, date), upload (max 2 MB, PEM/OpenSSH/.crt), download, delete. Sidebar link "Keys & certs".
- **Design system and layout**
  - New visual design applied across the app: warm gray background (`#EEEDE9`), black ink, texture overlay, and typography (type-display, type-label, type-mono). Global design tokens and utility classes in `index.css`.
  - **App layout**: Three-column grid (sidebar 280px, main content, context panel 320px) with header (brand “LEGACY DOCS”, status pill “Local Storage Active”, vault status, Lock button), left sidebar (System Index with Overview + entry list, Emergency Protocols with Power Failure and Successor Key), and optional right context panel on entry detail (Quick Actions: Edit Document, View History, Print/PDF; Related Systems; system ID footer).
  - Reusable layout components in `src/components/layout/`: `TextureOverlay`, `Brand`, `StatusPill`, `NavSection`, `NavItem`, `DataBlock`, `DocMeta`, `ActionButton`, `ContextPanel`, `AppLayout`, `ProtectedLayout`. Entry detail page uses `DocMeta`, `DataBlock` for sections, and registers context-panel actions via `LayoutContext`.
  - Unlock page uses `TextureOverlay`, `legacy-standalone`, and `legacy-card` with the same design tokens. Form inputs and buttons use border-based legacy styles.
  - Routes refactored: protected routes render inside `ProtectedLayout` (with `LayoutProvider`) and nested routes for `entries`, `entries/new`, `entries/:id`, `export-import`.

- **Unlock / Store**
  - When no store exists locally, user can choose: **Create new LegacyLink Store** (then set a new decryption key and confirm) or **Open existing LegacyLink Store** (select exported file, then enter decryption key; key is verified before importing).
  - New store creation persists an empty encrypted vault and unlocks in one step; opening existing store decrypts the file to verify the key, then saves to local storage and unlocks.

- **Architecture**
  - `docs/ARCHITECTURE-REVIEW.md`: architecture review summary and refactor log (layer alignment, coupling, duplication, testability, refactors applied).

### Fixed

- **New entry scroll**
  - Main content area can scroll when adding a new entry: grid main cell now has `min-height: 0` so overflow-y works.
- **System name display**
  - Removed hardcoded "v2.0" from entry (system) title on the entry detail page.
- **Category field**
  - Category select in New Entry and Edit forms is styled like other inputs (border, padding, font) via `.legacy-content select` and shared form styles.
- **New entry**
  - Creating a new entry no longer shows "Entry not found." after save. Entry creation now uses a single `createEntry(templateId, title, sections)` so the new entry is written and persisted in one vault update (fixes race with previous addEntry + updateEntry flow).

### Changed (refactor / cleanup)

- **Vault persistence:** All saves go through the file-based layer when a vault file handle is present (`persistFile` → `buildPayloadForSave` + `writeVaultToHandle`). VaultContext holds `fileHandle` and `lastPayload`; `createNewStoreWithHandle(handle, passphrase)` and `importExistingStore(file, passphrase, handle?)` replace the previous create/unlock-from-db flow. Index no longer checks IndexedDB on load (`hasExistingStore` is always `false`). **Phase 4:** db.ts and passkey removed; vault-service `unlockVault`, `saveVault`, `createAndSaveEmptyVault` removed.
- **Unlock page:** Entry is choice-only (Import vault / Create a new one). Create flow uses save picker then create-key form; import uses open picker or file input then passphrase form. Passkey unlock and registration were removed in Phase 4.
- **Shared crypto**: `validateStoredEncryptedBlob(value)` and `readStoredBlobFromFile(file)` in `vault-crypto.ts`; UnlockPage and ExportImportPage use them for consistent file validation.
- **Shared styles**: `forms.formColumn`, `forms.formActionsRow`, `forms.fileInputHidden`, `forms.labelBlock` in `shared.ts`; UnlockPage and ExportImportPage use them.
- **TemplateForm**: `onSave` is optional; callers can omit it. Error-state “Back to list” uses `links.back` on EntryDetailPage and NewEntryPage.
- **EntryDetailPage**: Section headings use `typography.h2`. Comments added for `addEntry` (VaultContext) and `getAllTemplates` (templates).
- **TypeScript**: `tsconfig` includes `@testing-library/jest-dom/vitest` so test matchers type-check.

### Testing

- **VaultContext** (`src/context/VaultContext.test.tsx`): Updated to use `createNewStoreWithHandle(mockHandle, "key1")` and mocked `file-vault-storage`; removed tests that relied on db-based unlock.
- **UnlockPage** (`src/pages/UnlockPage.test.tsx`): Updated for choice-only flow; tests for "Import vault" / "Create a new one", create flow with mocked `showSaveFilePicker`, and create vault with matching keys and navigation. Removed tests for "store exists" unlock form (no longer applicable).
- **vault-service** (`src/vault/vault-service.test.ts`): Tests for `importVaultFromBlob` and `createEmptyEntry` only (db-based unlock/save/create removed with Phase 4).
- **NewEntryPage** (`src/pages/NewEntryPage.test.tsx`): Smoke tests that page renders with "New entry" and Create button and uses `createEntry` from context.

### Changed

- **Refactor (architecture)**
  - Shared base64 encoding/decoding in `src/utils/base64.ts`; `vault-crypto` uses it.
  - Vault context exposes `exportVault()`, `importVault(stored)`; `registerPasskey` removed in Phase 4.
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
