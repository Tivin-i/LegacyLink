# LegacyLink Architecture Review

Review date: 2025-02-19. This document summarizes the architecture review and refactors applied, and has been updated to reflect the file-based vault redesign (Phases 1–4).

## 1. Architecture alignment and layer boundaries

The codebase aligns with `docs/ARCHITECTURE.md`:

- **UI layer**: Pages (`UnlockPage`, `EntryListPage`, `EntryDetailPage`, `NewEntryPage`, `ExportImportPage`) and `TemplateForm` component.
- **Vault logic**: `VaultContext` (session state, CRUD) and `vault-service` (createInitialPayload, migrateVault, export/import helpers, createEmptyEntry).
- **Crypto layer**: `vault-crypto`, `kdf`, `cipher`, `constants`; key in memory only.
- **Storage**: File-based only. `file-vault-storage` (`readVaultFromFile`, `readVaultFromHandle`, `writeVaultToHandle`, `buildPayloadForSave`). No IndexedDB; no passkey.

Boundaries are clear. The context exposes `exportVault()`, `saveCopyToHandle(handle)`, and `importVault(stored)` so the UI does not need the passphrase; the vault layer holds it internally.

## 2. Coupling issues (historical and current)

- **passphraseRef in context**: Export/import and passkey registration previously required the UI to read `passphraseRef`. This was removed by adding context methods that use the ref internally. Passkey has since been removed; only passphrase unlock remains.
- **Pages and vault-service**: Only `ExportImportPage` used to import `vault-service` directly for export/import. It now uses only context methods (`exportVault`, `saveCopyToHandle`, `importVault`).

## 3. Duplication

- **Base64 encoding/decoding**: A shared `src/utils/base64.ts` is used by `vault-crypto`. (Previously also by `passkey`, which has been removed.)
- **Inline styles**: Repeated patterns are centralized in `src/styles/shared.ts` where applicable.

## 4. Testability

- **Crypto and storage**: Pure functions and async I/O; easy to unit test. Existing tests: `vault-crypto.test.ts`, `vault-service.test.ts`.
- **VaultContext**: Uses `file-vault-storage`; tests mock it and use `createNewStoreWithHandle` for the file-based flow.

## 5. Refactors applied

| Refactor | Paths | Rationale |
|----------|--------|-----------|
| Shared base64 util | `src/utils/base64.ts`; `vault-crypto.ts` | Single implementation; remove duplication. |
| Context export/import API | `VaultContext.tsx`, `ExportImportPage.tsx` | Add `exportVault()`, `saveCopyToHandle(handle)`, `importVault(stored)`; passphrase stays internal. |
| Shared UI styles | `src/styles/shared.ts`; pages and `TemplateForm.tsx` | Centralize layout, links, buttons, messages. |
| File-based vault | `file-vault-storage.ts`, `VaultContext`, `UnlockPage`, etc. | Single encrypted vault file; no IndexedDB; no passkey. |

## 6. Current state (file-based vault)

- **Entry:** UnlockPage always shows choice: Import vault or Create a new one. No stored handle across sessions.
- **Persistence:** All saves go through `persistFile` → `buildPayloadForSave` + `writeVaultToHandle`. VaultContext holds `fileHandle` and `lastPayload`.
- **Optional features:** Export/Import page offers "Save a copy as…" (save picker) and "Open another vault"; Settings shows version history (restore) and approximate vault file size.
