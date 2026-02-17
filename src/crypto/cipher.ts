import { IV_LENGTH, CIPHER_NAME } from "./constants";

/**
 * Encrypt plaintext with AES-GCM. Returns { iv, ciphertext }.
 */
export async function encrypt(
  key: CryptoKey,
  plaintext: Uint8Array
): Promise<{ iv: Uint8Array; ciphertext: Uint8Array }> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: CIPHER_NAME,
      iv: iv as BufferSource,
      tagLength: 128,
    },
    key,
    plaintext as BufferSource
  );
  return {
    iv,
    ciphertext: new Uint8Array(ciphertext),
  };
}

/**
 * Decrypt ciphertext with AES-GCM.
 */
export async function decrypt(
  key: CryptoKey,
  iv: Uint8Array,
  ciphertext: Uint8Array
): Promise<Uint8Array> {
  const plaintext = await crypto.subtle.decrypt(
    {
      name: CIPHER_NAME,
      iv: iv as BufferSource,
      tagLength: 128,
    },
    key,
    ciphertext as BufferSource
  );
  return new Uint8Array(plaintext);
}
