import { encodeBase64, decodeBase64 } from "../utils/base64";
import { deriveKey, randomSalt } from "./kdf";
import { encrypt, decrypt } from "./cipher";
import { MAX_VAULT_FILE_BYTES } from "./constants";
import type { VaultData, DecryptedVaultPayload } from "../vault-types";

const ENCODING = "utf-8";

/** Single message for all decrypt failures to avoid timing leakage (wrong key vs invalid format). */
const DECRYPT_FAILED_MSG = "Wrong key or invalid file.";

export interface EncryptedBlob {
  version: number;
  salt: Uint8Array;
  iv: Uint8Array;
  ciphertext: Uint8Array;
}

/**
 * Encrypt vault data with a passphrase. Salt and IV are generated and included in the result.
 * @param saltLength Optional salt length override (bytes). Defaults to SALT_LENGTH constant.
 */
export async function encryptVault(
  passphrase: string,
  data: VaultData,
  saltLength?: number
): Promise<EncryptedBlob> {
  const salt = randomSalt(saltLength);
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
 * Decrypt vault blob with passphrase. Returns decrypted VaultData or throws generic error on wrong key/corruption.
 */
export async function decryptVault(
  passphrase: string,
  blob: EncryptedBlob
): Promise<VaultData> {
  try {
    const key = await deriveKey(passphrase, blob.salt);
    const plaintext = await decrypt(key, blob.iv, blob.ciphertext);
    const text = new TextDecoder(ENCODING).decode(plaintext);
    const data = JSON.parse(text) as VaultData;
    if (typeof data.version !== "number" || !Array.isArray(data.entries)) {
      throw new Error(DECRYPT_FAILED_MSG);
    }
    return data;
  } catch {
    throw new Error(DECRYPT_FAILED_MSG);
  }
}

const PAYLOAD_FORMAT_VERSION = 2;

function isLegacyVaultData(value: unknown): value is VaultData {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof (value as VaultData).version === "number" &&
    Array.isArray((value as VaultData).entries)
  );
}

function isDecryptedVaultPayload(value: unknown): value is DecryptedVaultPayload {
  if (value === null || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return (
    o.format === PAYLOAD_FORMAT_VERSION &&
    isLegacyVaultData(o.current) &&
    Array.isArray(o.versions) &&
    typeof o.versionHistoryLimit === "number"
  );
}

/**
 * Encrypt the full vault file payload (current + versions + limit).
 * Used for file-based storage; entire file is one encrypted blob.
 * @param saltLength Optional salt length override (bytes). Defaults to SALT_LENGTH constant.
 */
export async function encryptPayload(
  passphrase: string,
  payload: DecryptedVaultPayload,
  saltLength?: number
): Promise<EncryptedBlob> {
  const salt = randomSalt(saltLength);
  const key = await deriveKey(passphrase, salt);
  const plaintext = new TextEncoder().encode(
    JSON.stringify({ ...payload, format: PAYLOAD_FORMAT_VERSION })
  );
  const { iv, ciphertext } = await encrypt(key, plaintext);
  return {
    version: 1,
    salt,
    iv,
    ciphertext,
  };
}

/**
 * Decrypt the full vault file payload.
 * Supports legacy files: if plaintext is a single VaultData, returns wrapped payload.
 * Throws a single generic error for wrong key or invalid format to avoid timing leakage.
 */
export async function decryptPayload(
  passphrase: string,
  blob: EncryptedBlob
): Promise<DecryptedVaultPayload> {
  try {
    const key = await deriveKey(passphrase, blob.salt);
    const plaintext = await decrypt(key, blob.iv, blob.ciphertext);
    const text = new TextDecoder(ENCODING).decode(plaintext);
    const parsed = JSON.parse(text) as unknown;
    if (isDecryptedVaultPayload(parsed)) {
      return {
        current: parsed.current,
        versions: parsed.versions,
        versionHistoryLimit: parsed.versionHistoryLimit,
      };
    }
    if (isLegacyVaultData(parsed)) {
      return {
        current: parsed,
        versions: [],
        versionHistoryLimit: 10,
      };
    }
    throw new Error(DECRYPT_FAILED_MSG);
  } catch {
    throw new Error(DECRYPT_FAILED_MSG);
  }
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
const FILE_TOO_LARGE_MSG = "Vault file is too large. Maximum size is 50 MB.";

/**
 * Read and validate a StoredEncryptedBlob from a File (e.g. file input or drag-drop).
 */
export function readStoredBlobFromFile(
  file: File
): Promise<StoredEncryptedBlob> {
  if (file.size > MAX_VAULT_FILE_BYTES) {
    return Promise.reject(new Error(FILE_TOO_LARGE_MSG));
  }
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

