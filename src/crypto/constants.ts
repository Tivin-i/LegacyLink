export const PBKDF2_ITERATIONS = 600_000;
export const SALT_LENGTH = 16;
export const IV_LENGTH = 12;
export const KEY_LENGTH = 256;
export const KDF_NAME = "PBKDF2";
export const CIPHER_NAME = "AES-GCM";

/** Max size in bytes for a vault file read (import/open). Prevents DoS from huge files. */
export const MAX_VAULT_FILE_BYTES = 50 * 1024 * 1024; // 50 MB
