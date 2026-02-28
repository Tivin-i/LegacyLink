import { describe, it, expect } from "vitest";
import { encodeBase64, decodeBase64, arrayBufferToBase64, base64ToArrayBuffer } from "./base64";

describe("base64", () => {
  it("encodes and decodes empty buffer", () => {
    const bytes = new Uint8Array([]);
    const b64 = encodeBase64(bytes);
    expect(b64).toBe("");
    expect(decodeBase64(b64)).toEqual(bytes);
  });

  it("encodes and decodes small buffer round-trip", () => {
    const bytes = new Uint8Array([72, 101, 108, 108, 111]);
    const b64 = encodeBase64(bytes);
    expect(b64).toBe("SGVsbG8=");
    expect(decodeBase64(b64)).toEqual(bytes);
  });

  it("encodes and decodes buffer larger than engine argument limit (65KB+)", () => {
    const size = 70_000;
    const bytes = new Uint8Array(size);
    for (let i = 0; i < size; i++) bytes[i] = i % 256;
    const b64 = encodeBase64(bytes);
    expect(b64.length).toBeGreaterThan(0);
    const decoded = decodeBase64(b64);
    expect(decoded.length).toBe(size);
    expect(decoded).toEqual(bytes);
  });

  it("arrayBufferToBase64 and base64ToArrayBuffer round-trip", () => {
    const buf = new ArrayBuffer(100);
    const view = new Uint8Array(buf);
    for (let i = 0; i < 100; i++) view[i] = i;
    const b64 = arrayBufferToBase64(buf);
    const back = base64ToArrayBuffer(b64);
    expect(new Uint8Array(back)).toEqual(view);
  });
});
