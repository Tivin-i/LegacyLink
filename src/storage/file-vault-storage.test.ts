import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  readVaultFromFile,
  buildPayloadForSave,
} from "./file-vault-storage";
import type { DecryptedVaultPayload, VaultData } from "../vault-types";
import { MAX_VAULT_FILE_BYTES } from "../crypto/constants";

vi.mock("../crypto/vault-crypto", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../crypto/vault-crypto")>();
  return {
    ...actual,
    decryptPayload: vi.fn().mockResolvedValue({
      current: { version: 1, entries: [] },
      versions: [],
      versionHistoryLimit: 10,
    } as DecryptedVaultPayload),
  };
});

describe("file-vault-storage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("readVaultFromFile", () => {
    it("rejects file larger than MAX_VAULT_FILE_BYTES", async () => {
      const bigFile = new File(
        [new ArrayBuffer(MAX_VAULT_FILE_BYTES + 1)],
        "vault.json",
        { type: "application/json" }
      );
      await expect(
        readVaultFromFile(bigFile, "passphrase")
      ).rejects.toThrow("Vault file is too large");
    });
  });

  describe("buildPayloadForSave", () => {
    it("returns payload with current and versions when previousPayload exists", () => {
      const previous: DecryptedVaultPayload = {
        current: { version: 1, entries: [], versionHistoryLimit: 5 },
        versions: [],
        versionHistoryLimit: 5,
      };
      const newCurrent: VaultData = {
        version: 1,
        entries: [{ id: "e1", templateId: "t", title: "E", updatedAt: "", sections: {} }],
        versionHistoryLimit: 5,
      };
      const result = buildPayloadForSave(previous, newCurrent);
      expect(result.current).toEqual(expect.objectContaining({ version: 1, entries: expect.any(Array) }));
      expect(result.versionHistoryLimit).toBe(5);
      expect(result.versions).toHaveLength(1);
    });

    it("returns payload with empty versions when previousPayload is null", () => {
      const newCurrent: VaultData = { version: 1, entries: [], versionHistoryLimit: 10 };
      const result = buildPayloadForSave(null, newCurrent);
      expect(result.versions).toHaveLength(0);
      expect(result.versionHistoryLimit).toBe(10);
    });
  });
});
