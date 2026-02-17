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
    salt: arrayToBase64(blob.salt),
    iv: arrayToBase64(blob.iv),
    ciphertext: arrayToBase64(blob.ciphertext),
  };
}

/**
 * Deserialize from stored format back to EncryptedBlob.
 */
export function storedToBlob(stored: StoredEncryptedBlob): EncryptedBlob {
  return {
    version: stored.version,
    salt: base64ToArray(stored.salt),
    iv: base64ToArray(stored.iv),
    ciphertext: base64ToArray(stored.ciphertext),
  };
}

export interface StoredEncryptedBlob {
  version: number;
  salt: string;
  iv: string;
  ciphertext: string;
}

function arrayToBase64(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...arr));
}

function base64ToArray(b64: string): Uint8Array {
  const binary = atob(b64);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return arr;
}
