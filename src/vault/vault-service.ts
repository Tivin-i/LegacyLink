import {
  encryptVault,
  decryptVault,
  blobToStored,
  storedToBlob,
  type StoredEncryptedBlob,
} from "../crypto/vault-crypto";
import { readVaultBlob, writeVaultBlob } from "../storage/db";
import type { VaultData, Entry } from "../vault-types";

const DEFAULT_VAULT: VaultData = { version: 1, entries: [] };

/**
 * Unlock vault with passphrase. Returns decrypted data or throws.
 */
export async function unlockVault(passphrase: string): Promise<VaultData> {
  const stored = await readVaultBlob();
  if (!stored) return { ...DEFAULT_VAULT, entries: [] };
  const blob = storedToBlob(stored);
  return decryptVault(passphrase, blob);
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
  return decryptVault(passphrase, blob);
}

/**
 * Generate a new entry with empty sections for a template.
 */
export function createEmptyEntry(
  templateId: string,
  title: string
): Entry {
  return {
    id: crypto.randomUUID(),
    templateId,
    title: title || "Untitled",
    updatedAt: new Date().toISOString(),
    sections: {},
  };
}
