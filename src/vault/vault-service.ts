import {
  encryptVault,
  decryptVault,
  blobToStored,
  storedToBlob,
  type StoredEncryptedBlob,
} from "../crypto/vault-crypto";
import { readVaultBlob, writeVaultBlob } from "../storage/db";
import type { VaultData, Entry, HistoryEntry } from "../vault-types";

const VAULT_VERSION = 3;
const DEFAULT_VAULT: VaultData = {
  version: VAULT_VERSION,
  entries: [],
  categories: [],
  successorGuide: "",
  history: [],
  uploadedKeys: [],
};

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
      version: VAULT_VERSION,
      successorGuide: out.successorGuide ?? "",
      history: out.history ?? [],
      uploadedKeys: out.uploadedKeys ?? [],
    };
  }
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
 * Unlock vault with passphrase. Returns decrypted data or throws.
 */
export async function unlockVault(passphrase: string): Promise<VaultData> {
  const stored = await readVaultBlob();
  if (!stored) return { ...DEFAULT_VAULT, entries: [] };
  const blob = storedToBlob(stored);
  const raw = await decryptVault(passphrase, blob);
  return migrateVault(raw);
}

/**
 * Persist vault encrypted with passphrase.
 */
export async function saveVault(
  passphrase: string,
  data: VaultData
): Promise<void> {
  const blob = await encryptVault(passphrase, data);
  await writeVaultBlob(blobToStored(blob));
}

/**
 * Create a new empty store and persist it encrypted with the given passphrase.
 */
/** Create and persist empty vault; returns the initial vault data for in-memory state. */
export async function createAndSaveEmptyVault(passphrase: string): Promise<VaultData> {
  const initial: VaultData = {
    version: VAULT_VERSION,
    entries: [],
    categories: [],
    successorGuide: "",
    history: appendHistory([], { action: "store_created" }),
    uploadedKeys: [],
  };
  await saveVault(passphrase, initial);
  return initial;
}

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
