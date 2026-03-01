import {
  PBKDF2_ITERATIONS,
  SALT_LENGTH,
  KEY_LENGTH,
  KDF_NAME,
} from "./constants";

/**
 * Derive a 256-bit key from passphrase and salt using PBKDF2-HMAC-SHA256.
 */
export async function deriveKey(
  passphrase: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: KDF_NAME,
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-512",
    },
    keyMaterial,
    { name: "AES-GCM", length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Generate a random salt for key derivation.
 * @param length Override salt length in bytes (default: SALT_LENGTH from constants).
 */
export function randomSalt(length?: number): Uint8Array {
  const len = length ?? SALT_LENGTH;
  return crypto.getRandomValues(new Uint8Array(len));
}
