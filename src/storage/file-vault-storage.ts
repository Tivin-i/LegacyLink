/**
 * File-based vault storage. Reads/writes the vault as a single encrypted file.
 * No cleartext metadata; entire file is one StoredEncryptedBlob.
 */

import {
  decryptPayload,
  encryptPayload,
  blobToStored,
  storedToBlob,
  validateStoredEncryptedBlob,
} from "../crypto/vault-crypto";
import { MAX_VAULT_FILE_BYTES } from "../crypto/constants";
import type { DecryptedVaultPayload, VaultData } from "../vault-types";

const INVALID_FILE_MSG =
  "Invalid file format. Choose an exported LegacyLink store file.";

const FILE_TOO_LARGE_MSG =
  "Vault file is too large. Maximum size is 50 MB.";

function readFileAsText(file: File): Promise<string> {
  if (file.size > MAX_VAULT_FILE_BYTES) {
    return Promise.reject(new Error(FILE_TOO_LARGE_MSG));
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsText(file);
  });
}

/**
 * Read and decrypt vault from a File (e.g. from file input).
 */
export async function readVaultFromFile(
  file: File,
  passphrase: string
): Promise<DecryptedVaultPayload> {
  const text = await readFileAsText(file);
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(INVALID_FILE_MSG);
  }
  if (!validateStoredEncryptedBlob(parsed)) {
    throw new Error(INVALID_FILE_MSG);
  }
  const blob = storedToBlob(parsed);
  return decryptPayload(passphrase, blob);
}

/**
 * Read and decrypt vault from a FileSystemFileHandle.
 */
export async function readVaultFromHandle(
  handle: FileSystemFileHandle,
  passphrase: string
): Promise<DecryptedVaultPayload> {
  const file = await handle.getFile();
  return readVaultFromFile(file, passphrase);
}

/**
 * Encrypt payload and write to the given file handle.
 * @param saltLength Optional salt length override (bytes).
 */
export async function writeVaultToHandle(
  handle: FileSystemFileHandle,
  passphrase: string,
  payload: DecryptedVaultPayload,
  saltLength?: number
): Promise<void> {
  const blob = await encryptPayload(passphrase, payload, saltLength);
  const stored = blobToStored(blob);
  const text = JSON.stringify(stored, null, 2);
  const writable = await handle.createWritable();
  await writable.write(text);
  await writable.close();
}

const DEFAULT_VERSION_HISTORY_LIMIT = 10;

/**
 * Build the payload to write when saving the vault file.
 * Pushes previous current into versions and trims to versionHistoryLimit.
 */
export function buildPayloadForSave(
  previousPayload: DecryptedVaultPayload | null,
  newCurrent: VaultData
): DecryptedVaultPayload {
  const limit = newCurrent.versionHistoryLimit ?? previousPayload?.versionHistoryLimit ?? DEFAULT_VERSION_HISTORY_LIMIT;
  if (!previousPayload) {
    return {
      current: { ...newCurrent, versionHistoryLimit: limit },
      versions: [],
      versionHistoryLimit: limit,
    };
  }
  const versions = [previousPayload.current, ...previousPayload.versions].slice(0, limit);
  return {
    current: { ...newCurrent, versionHistoryLimit: limit },
    versions,
    versionHistoryLimit: limit,
  };
}
