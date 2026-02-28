# LegacyLink Architecture Review

Review date: 2025-02-19. This document summarizes the architecture review and refactors applied.

## 1. Architecture alignment and layer boundaries

The codebase aligns with `docs/ARCHITECTURE.md`:

- **UI layer**: Pages (`UnlockPage`, `EntryListPage`, `EntryDetailPage`, `NewEntryPage`, `ExportImportPage`) and `TemplateForm` component.
- **Vault logic**: `VaultContext` (session state, CRUD) and `vault-service` (unlock, save, export/import, createEmptyEntry).
- **Crypto layer**: `vault-crypto`, `kdf`, `cipher`, `constants`; key in memory only.
- **Auth**: `passkey` (WebAuthn PRF, register, authenticate).
- **Storage**: `db` (IndexedDB via idb; vault blob + meta).

Boundaries are clear. One improvement: avoid exposing the passphrase ref from the context so that only the vault layer needs to know how the passphrase is held. Refactor: add `exportVault()` and `importVault(stored)` on the context that use the passphrase internally, and stop exposing `passphraseRef` to the UI.

## 2. Coupling issues

- **passphraseRef in context**: Export/import and passkey registration required the UI to read `passphraseRef`. This was removed by adding context methods that use the ref internally.
- **Auth and storage**: `passkey` imports `storage/db` for meta (passkey material). This is acceptable; meta is passkey-specific. A future optional step could be a thin meta abstraction if we add more meta consumers.
- **Pages and vault-service**: Only `ExportImportPage` imported `vault-service` directly for export/import. After refactor, it uses only context methods.

## 3. Duplication

- **Base64 encoding/decoding**: Implementations existed in `vault-crypto` (Uint8Array) and `passkey` (ArrayBuffer). A shared `src/utils/base64.ts` was added and both modules now use it.
- **Inline styles**: Repeated patterns (main container, back link, primary/secondary buttons, error/success text) across pages and `TemplateForm`. A shared `src/styles/shared.ts` was added to centralize common layout and component styles.

## 4. Testability

- **Crypto and storage**: Pure functions and async I/O; easy to unit test. Existing test: `vault-crypto.test.ts`.
- **VaultContext**: Depends on `vault-service`; tests can mock `vault-service` or use real implementations in integration tests. Hiding `passphraseRef` and exposing `exportVault`/`importVault` keeps the vault API in one place and improves testability.
- **Passkey**: Browser/WebAuthn-dependent; best tested via E2E or manual testing; no change.

## 5. Refactors applied

| Refactor | Paths | Rationale |
|----------|--------|-----------|
| Shared base64 util | `src/utils/base64.ts`; `vault-crypto.ts`, `passkey.ts` | Single implementation for Uint8Array/ArrayBuffer; remove duplication. |
| Context export/import API | `VaultContext.tsx`, `ExportImportPage.tsx` | Add `exportVault()` and `importVault(stored)`; remove `passphraseRef` from public API so UI does not depend on how passphrase is held. |
| Shared UI styles | `src/styles/shared.ts`; pages and `TemplateForm.tsx` | Centralize layout (main, section), links (back, primary), buttons (primary, secondary, danger), messages (error, success); keep pages DRY. |

## 6. What was not changed

- No features removed.
- No change to crypto algorithm, key lifecycle, or storage format.
- No change to routing, templates, or data model.
- Passkey registration still uses the same passphrase (obtained internally via context) when the user clicks Register; only the way the page gets that passphrase was changed (via context method instead of ref).
