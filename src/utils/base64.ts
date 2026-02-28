/**
 * Shared base64 encoding/decoding for Uint8Array and ArrayBuffer.
 * Used by crypto (vault blob) and auth (passkey) layers.
 */

export function encodeBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

export function decodeBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return arr;
}

export function arrayBufferToBase64(buf: ArrayBuffer): string {
  return encodeBase64(new Uint8Array(buf));
}

export function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const u8 = decodeBase64(b64);
  return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength) as ArrayBuffer;
}
