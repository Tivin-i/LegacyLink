/**
 * Optional WebAuthn passkey support for unlocking the vault.
 * Uses PRF extension to derive a key and store encrypted passphrase.
 * Requires a resident key with user verification.
 */

const META_KEY_PASSKEY = "passkey";
const PRF_SALT_LENGTH = 16;

export interface StoredPasskeyMeta {
  credentialIdBase64: string;
  prfSaltBase64: string;
  prfFirstBase64: string;
  encryptedPassphraseBase64: string;
  ivBase64: string;
}

function getRandomBytes(len: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(len));
}

async function deriveKeyFromPrf(prfResult: ArrayBuffer, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    prfResult as BufferSource,
    "HKDF",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: salt as unknown as BufferSource,
      info: new TextEncoder().encode("legacylink-vault-unlock"),
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptPassphrase(key: CryptoKey, passphrase: string): Promise<{ iv: Uint8Array; ciphertext: Uint8Array }> {
  const iv = getRandomBytes(12);
  const enc = new TextEncoder();
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource, tagLength: 128 },
    key,
    enc.encode(passphrase)
  );
  return { iv, ciphertext: new Uint8Array(ct) };
}

async function decryptPassphrase(
  key: CryptoKey,
  iv: Uint8Array,
  ciphertext: Uint8Array
): Promise<string> {
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as BufferSource, tagLength: 128 },
    key,
    ciphertext as BufferSource
  );
  return new TextDecoder().decode(pt);
}

function toArrayBuffer(u: Uint8Array): ArrayBuffer {
  return u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength) as ArrayBuffer;
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const buf = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
  return buf.buffer.slice(0, buf.length) as ArrayBuffer;
}

export function isPasskeySupported(): boolean {
  return (
    typeof window !== "undefined" &&
    window.PublicKeyCredential !== undefined &&
    typeof window.PublicKeyCredential !== "undefined"
  );
}

export async function isPasskeyConfigured(): Promise<boolean> {
  const meta = await import("../storage/db").then((db) => db.getMeta<StoredPasskeyMeta>(META_KEY_PASSKEY));
  return !!meta?.credentialIdBase64;
}

/**
 * Register passkey for current origin. Call when vault is unlocked.
 * Stores encrypted passphrase in meta; user can later unlock with passkey.
 */
export async function registerPasskey(passphrase: string): Promise<{ ok: boolean; error?: string }> {
  if (!isPasskeySupported()) return { ok: false, error: "Passkeys are not supported in this browser." };

  const prfSalt = getRandomBytes(PRF_SALT_LENGTH);
  const prfFirstInput = getRandomBytes(32);
  const challenge = getRandomBytes(32);
  const userId = getRandomBytes(16);

  try {
    const createOptions: CredentialCreationOptions = {
      publicKey: {
        rp: { name: "LegacyLink", id: window.location.hostname },
        user: {
          id: toArrayBuffer(userId),
          name: "legacylink@local",
          displayName: "LegacyLink vault",
        },
        challenge: toArrayBuffer(challenge),
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },
          { type: "public-key", alg: -257 },
        ],
        authenticatorSelection: {
          residentKey: "required",
          userVerification: "required",
          authenticatorAttachment: "platform",
        },
        extensions: {
          prf: {
            eval: {
              first: arrayBufferToBase64(toArrayBuffer(prfFirstInput)),
            },
          },
        } as unknown as AuthenticationExtensionsClientInputs,
      },
    };

    const credential = (await navigator.credentials.create(createOptions)) as PublicKeyCredential | null;
    if (!credential) return { ok: false, error: "Passkey creation was cancelled or failed." };

    const credentialId = credential.rawId;
    const allowCredentials: PublicKeyCredentialDescriptor[] = [{ type: "public-key", id: credentialId }];

    const getOptions: CredentialRequestOptions = {
      publicKey: {
        challenge: toArrayBuffer(getRandomBytes(32)),
        allowCredentials,
        userVerification: "required",
        extensions: {
          prf: {
            eval: {
              first: arrayBufferToBase64(toArrayBuffer(prfFirstInput)),
            },
          },
        } as unknown as AuthenticationExtensionsClientInputs,
      },
    };

    const assertion = (await navigator.credentials.get(getOptions)) as PublicKeyCredential | null;
    if (!assertion) return { ok: false, error: "Passkey assertion failed." };

    const prfResults = (assertion.response as AuthenticatorAssertionResponse & { getClientExtensionResults?: () => { prf?: { results?: { first?: ArrayBuffer } } } }).getClientExtensionResults?.();
    const prfFirstResult = prfResults?.prf?.results?.first;
    if (!prfFirstResult) return { ok: false, error: "PRF extension not available. Use a browser that supports passkey PRF." };

    const key = await deriveKeyFromPrf(prfFirstResult, prfSalt);
    const { iv, ciphertext } = await encryptPassphrase(key, passphrase);

    const meta: StoredPasskeyMeta = {
      credentialIdBase64: arrayBufferToBase64(credentialId),
      prfSaltBase64: arrayBufferToBase64(toArrayBuffer(prfSalt)),
      prfFirstBase64: arrayBufferToBase64(toArrayBuffer(prfFirstInput)),
      encryptedPassphraseBase64: arrayBufferToBase64(toArrayBuffer(ciphertext)),
      ivBase64: arrayBufferToBase64(toArrayBuffer(iv)),
    };

    const db = await import("../storage/db");
    await db.setMeta(META_KEY_PASSKEY, meta);
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Passkey registration failed.";
    return { ok: false, error: message };
  }
}

/**
 * Unlock using passkey. Returns passphrase on success so caller can run normal unlock.
 */
export async function authenticateWithPasskey(): Promise<{ ok: true; passphrase: string } | { ok: false; error: string }> {
  if (!isPasskeySupported()) return { ok: false, error: "Passkeys are not supported." };

  const db = await import("../storage/db");
  const meta = await db.getMeta<StoredPasskeyMeta>(META_KEY_PASSKEY);
  if (!meta?.credentialIdBase64) return { ok: false, error: "No passkey registered." };

  const credentialId = base64ToArrayBuffer(meta.credentialIdBase64) as ArrayBuffer;
  const prfSaltBytes = new Uint8Array(base64ToArrayBuffer(meta.prfSaltBase64));
  const prfFirstBase64 = meta.prfFirstBase64;
  if (!prfFirstBase64) return { ok: false, error: "Invalid passkey data." };
  const encryptedPassphrase = new Uint8Array(base64ToArrayBuffer(meta.encryptedPassphraseBase64));
  const iv = new Uint8Array(base64ToArrayBuffer(meta.ivBase64));

  try {
    const getOptions: CredentialRequestOptions = {
      publicKey: {
        challenge: toArrayBuffer(getRandomBytes(32)),
        allowCredentials: [{ type: "public-key", id: credentialId as ArrayBuffer }],
        userVerification: "required",
        extensions: {
          prf: {
            eval: {
              first: prfFirstBase64,
            },
          },
        } as unknown as AuthenticationExtensionsClientInputs,
      },
    };

    const assertion = (await navigator.credentials.get(getOptions)) as PublicKeyCredential | null;
    if (!assertion) return { ok: false, error: "Passkey sign-in was cancelled or failed." };

    const prfResults = (assertion.response as AuthenticatorAssertionResponse & { getClientExtensionResults?: () => { prf?: { results?: { first?: ArrayBuffer } } } }).getClientExtensionResults?.();
    const prfFirstResult = prfResults?.prf?.results?.first;
    if (!prfFirstResult) return { ok: false, error: "PRF extension not available." };

    const key = await deriveKeyFromPrf(prfFirstResult, prfSaltBytes);
    const passphrase = await decryptPassphrase(key, iv, encryptedPassphrase);
    return { ok: true, passphrase };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Passkey sign-in failed.";
    return { ok: false, error: message };
  }
}
