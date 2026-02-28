import { encodeBase64, decodeBase64 } from "../utils/base64";
import { deriveKey, randomSalt } from "./kdf";
import { encrypt, decrypt } from "./cipher";
import type { VaultData } from "../vault-types";

const ENCODING = "utf-8";

export interface EncryptedBlob {
  version: number;
  salt: Uint8Array;
  iv: Uint8Array;
  ciphertext: Uint8Array;
}

/**
 * Encrypt vault data with a passphrase. Salt and IV are generated and included in the result.
 */
export async function encryptVault(
  passphrase: string,
  data: VaultData
): Promise<EncryptedBlob> {
  const salt = randomSalt();
  const key = await deriveKey(passphrase, salt);
  const plaintext = new TextEncoder().encode(JSON.stringify(data));
  const { iv, ciphertext } = await encrypt(key, plaintext);
  return {
    version: 1,
    salt,
    iv,
    ciphertext,
  };
}

/**
 * Decrypt vault blob with passphrase. Returns decrypted VaultData or throws on wrong key/corruption.
 */
export async function decryptVault(
  passphrase: string,
  blob: EncryptedBlob
): Promise<VaultData> {
  const key = await deriveKey(passphrase, blob.salt);
  const plaintext = await decrypt(key, blob.iv, blob.ciphertext);
  const text = new TextDecoder(ENCODING).decode(plaintext);
  const data = JSON.parse(text) as VaultData;
  if (typeof data.version !== "number" || !Array.isArray(data.entries)) {
    throw new Error("Invalid vault data");
  }
  return data;
}

/**
 * Serialize encrypted blob to a format suitable for IndexedDB or export file.
 */
export function blobToStored(blob: EncryptedBlob): StoredEncryptedBlob {
  return {
    version: blob.version,
    salt: encodeBase64(blob.salt),
    iv: encodeBase64(blob.iv),
    ciphertext: encodeBase64(blob.ciphertext),
  };
}

/**
 * Deserialize from stored format back to EncryptedBlob.
 */
export function storedToBlob(stored: StoredEncryptedBlob): EncryptedBlob {
  return {
    version: stored.version,
    salt: decodeBase64(stored.salt),
    iv: decodeBase64(stored.iv),
    ciphertext: decodeBase64(stored.ciphertext),
  };
}

export interface StoredEncryptedBlob {
  version: number;
  salt: string;
  iv: string;
  ciphertext: string;
}

/**
 * Type guard: returns true if value is a valid StoredEncryptedBlob.
 */
export function validateStoredEncryptedBlob(
  value: unknown
): value is StoredEncryptedBlob {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof (value as StoredEncryptedBlob).version === "number" &&
    typeof (value as StoredEncryptedBlob).salt === "string" &&
    typeof (value as StoredEncryptedBlob).iv === "string" &&
    typeof (value as StoredEncryptedBlob).ciphertext === "string"
  );
}

const INVALID_FILE_MSG = "Invalid file format. Choose an exported LegacyLink store file.";
const INVALID_STORE_MSG = "Invalid LegacyLink store file.";

/**
 * Read and validate a StoredEncryptedBlob from a File (e.g. file input or drag-drop).
 */
export function readStoredBlobFromFile(
  file: File
): Promise<StoredEncryptedBlob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string) as unknown;
        if (!validateStoredEncryptedBlob(json)) {
          reject(new Error(INVALID_STORE_MSG));
        } else {
          resolve(json);
        }
      } catch {
        reject(new Error(INVALID_FILE_MSG));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsText(file);
  });
}

