import { describe, it, expect } from "vitest";
import {
  encryptVault,
  decryptVault,
  blobToStored,
  storedToBlob,
  type EncryptedBlob,
} from "./vault-crypto";
import type { VaultData } from "../vault-types";

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

  it("throws on wrong passphrase", async () => {
    const blob = await encryptVault("correct", { version: 1, entries: [] });
    await expect(decryptVault("wrong", blob)).rejects.toThrow();
  });
});
