import {
  encryptVault,
  decryptVault,
  blobToStored,
  storedToBlob,
  type StoredEncryptedBlob,
} from "../crypto/vault-crypto";
import type { VaultData, Entry, HistoryEntry, DecryptedVaultPayload } from "../vault-types";

const VAULT_VERSION = 4;
const DEFAULT_VERSION_HISTORY_LIMIT = 10;

function migrateVault(data: VaultData): VaultData {
  let out: VaultData = { ...data };
  if (out.version < 2) {
    out = {
      ...out,
      version: 2,
      categories: out.categories ?? [],
      entries: (out.entries ?? []).map((e) => ({ ...e, categoryId: e.categoryId ?? undefined })),
    };
  }
  if (out.version < 3) {
    out = {
      ...out,
      version: 3,
      successorGuide: out.successorGuide ?? "",
      history: out.history ?? [],
      uploadedKeys: out.uploadedKeys ?? [],
    };
  }
  if (out.version < 4) {
    out = {
      ...out,
      version: VAULT_VERSION,
      userAka: out.userAka ?? "",
    };
  }
  out.versionHistoryLimit = out.versionHistoryLimit ?? DEFAULT_VERSION_HISTORY_LIMIT;
  return out;
}

const HISTORY_CAP = 500;

/** Append a history entry and cap length. */
export function appendHistory(
  history: HistoryEntry[] | undefined,
  entry: Omit<HistoryEntry, "at">
): HistoryEntry[] {
  const at = new Date().toISOString();
  const list = history ?? [];
  return [{ ...entry, at }, ...list].slice(0, HISTORY_CAP);
}

/**
 * Create initial payload for a new vault file (used with file storage).
 */
export function createInitialPayload(): DecryptedVaultPayload {
  const current: VaultData = {
    version: VAULT_VERSION,
    entries: [],
    categories: [],
    successorGuide: "",
    history: appendHistory([], { action: "store_created" }),
    uploadedKeys: [],
    userAka: "",
    versionHistoryLimit: DEFAULT_VERSION_HISTORY_LIMIT,
  };
  return {
    current,
    versions: [],
    versionHistoryLimit: DEFAULT_VERSION_HISTORY_LIMIT,
  };
}

/** Migrate vault data (e.g. after reading from file). Export for use in file flow. */
export { migrateVault };

/**
 * Export vault as encrypted blob (for file download).
 */
export async function exportVaultEncrypted(
  passphrase: string,
  data: VaultData
): Promise<StoredEncryptedBlob> {
  const blob = await encryptVault(passphrase, data);
  return blobToStored(blob);
}

/**
 * Import vault from encrypted blob (from file).
 */
export async function importVaultFromBlob(
  passphrase: string,
  stored: StoredEncryptedBlob
): Promise<VaultData> {
  const blob = storedToBlob(stored);
  const raw = await decryptVault(passphrase, blob);
  return migrateVault(raw);
}

/**
 * Generate a new entry with empty sections for a template.
 */
export function createEmptyEntry(
  templateId: string,
  title: string,
  categoryId?: string
): Entry {
  return {
    id: crypto.randomUUID(),
    templateId,
    title: title || "Untitled",
    updatedAt: new Date().toISOString(),
    sections: {},
    ...(categoryId != null && categoryId !== "" ? { categoryId } : {}),
  };
}
