import { describe, it, expect } from "vitest";
import {
  encryptVault,
  decryptVault,
  encryptPayload,
  decryptPayload,
  blobToStored,
  storedToBlob,
  validateStoredEncryptedBlob,
  type EncryptedBlob,
} from "./vault-crypto";
import type { VaultData } from "../vault-types";

const DECRYPT_FAILED_MSG = "Wrong key or invalid file.";

describe("vault-crypto", () => {
  it("encrypts and decrypts vault round-trip", async () => {
    const data: VaultData = {
      version: 1,
      entries: [
        {
          id: "test-id",
          templateId: "legacy-system",
          title: "Test",
          updatedAt: new Date().toISOString(),
          sections: {},
        },
      ],
    };
    const passphrase = "test-passphrase";
    const blob = await encryptVault(passphrase, data);
    expect(blob.version).toBe(1);
    expect(blob.salt.length).toBe(16);
    expect(blob.iv.length).toBe(12);
    expect(blob.ciphertext.length).toBeGreaterThan(0);

    const decrypted = await decryptVault(passphrase, blob);
    expect(decrypted.version).toBe(data.version);
    expect(decrypted.entries).toHaveLength(1);
    expect(decrypted.entries[0]?.title).toBe("Test");
  });

  it("blobToStored and storedToBlob round-trip", async () => {
    const data: VaultData = { version: 1, entries: [] };
    const blob = await encryptVault("key", data);
    const stored = blobToStored(blob);
    expect(stored.salt).toBeDefined();
    expect(stored.iv).toBeDefined();
    expect(stored.ciphertext).toBeDefined();

    const restored: EncryptedBlob = storedToBlob(stored);
    expect(restored.salt.length).toBe(blob.salt.length);
    expect(restored.iv.length).toBe(blob.iv.length);
    const decrypted = await decryptVault("key", restored);
    expect(decrypted.entries).toHaveLength(0);
  });

  it("blobToStored handles large ciphertext without RangeError", async () => {
    const largePayload: VaultData = {
      version: 1,
      entries: Array.from({ length: 500 }, (_, i) => ({
        id: `id-${i}`,
        templateId: "legacy-system",
        title: `Entry ${i}`,
        updatedAt: new Date().toISOString(),
        sections: { sec: { field: "x".repeat(500) } },
      })),
    };
    const blob = await encryptVault("key", largePayload);
    expect(blob.ciphertext.length).toBeGreaterThan(70000);
    const stored = blobToStored(blob);
    expect(stored.ciphertext.length).toBeGreaterThan(0);
    const restored = storedToBlob(stored);
    const decrypted = await decryptVault("key", restored);
    expect(decrypted.entries).toHaveLength(500);
  });

  it("throws on wrong passphrase", async () => {
    const blob = await encryptVault("correct", { version: 1, entries: [] });
    await expect(decryptVault("wrong", blob)).rejects.toThrow(DECRYPT_FAILED_MSG);
  });

  describe("encryptPayload / decryptPayload", () => {
    it("round-trips full payload with versions", async () => {
      const current: VaultData = { version: 1, entries: [], versionHistoryLimit: 5 };
      const payload = {
        current,
        versions: [],
        versionHistoryLimit: 5,
      };
      const blob = await encryptPayload("key", payload);
      const decrypted = await decryptPayload("key", blob);
      expect(decrypted.current.version).toBe(1);
      expect(decrypted.versions).toEqual([]);
      expect(decrypted.versionHistoryLimit).toBe(5);
    });

    it("throws same generic error for wrong passphrase and invalid format", async () => {
      const blob = await encryptPayload("right", {
        current: { version: 1, entries: [], versionHistoryLimit: 10 },
        versions: [],
        versionHistoryLimit: 10,
      });
      await expect(decryptPayload("wrong", blob)).rejects.toThrow(DECRYPT_FAILED_MSG);
      const tamperedBlob: EncryptedBlob = { ...blob, ciphertext: new Uint8Array([1, 2, 3]) };
      await expect(decryptPayload("right", tamperedBlob)).rejects.toThrow(DECRYPT_FAILED_MSG);
    });
  });

  describe("validateStoredEncryptedBlob", () => {
    it("returns true for valid stored blob", () => {
      const stored = { version: 1, salt: "a", iv: "b", ciphertext: "c" };
      expect(validateStoredEncryptedBlob(stored)).toBe(true);
    });

    it("returns false for null or non-object", () => {
      expect(validateStoredEncryptedBlob(null)).toBe(false);
      expect(validateStoredEncryptedBlob(undefined)).toBe(false);
      expect(validateStoredEncryptedBlob("x")).toBe(false);
    });

    it("returns false when required fields missing or wrong type", () => {
      expect(validateStoredEncryptedBlob({ version: 1, salt: "a", iv: "b" })).toBe(false);
      expect(validateStoredEncryptedBlob({ version: "1", salt: "a", iv: "b", ciphertext: "c" })).toBe(false);
    });
  });
});
