import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  importVaultFromBlob,
  createEmptyEntry,
  exportVaultEncrypted,
} from "./vault-service";
import type { VaultData } from "../vault-types";

describe("vault-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("importVaultFromBlob", () => {
    it("decrypts exported blob and returns vault data", async () => {
      const vault: VaultData = {
        version: 1,
        entries: [
          {
            id: "imp",
            templateId: "legacy-system",
            title: "Imported",
            updatedAt: new Date().toISOString(),
            sections: { "sec1": { "f1": "value" } },
          },
        ],
      };
      const stored = await exportVaultEncrypted("import-key", vault);
      const data = await importVaultFromBlob("import-key", stored);
      expect(data.entries).toHaveLength(1);
      expect(data.entries[0]?.title).toBe("Imported");
    });

    it("throws on wrong passphrase", async () => {
      const stored = await exportVaultEncrypted("right", { version: 1, entries: [] });
      await expect(importVaultFromBlob("wrong", stored)).rejects.toThrow();
    });

    it("round-trips large vault export and import without RangeError", async () => {
      const largeVault: VaultData = {
        version: 1,
        entries: Array.from({ length: 300 }, (_, i) => ({
          id: `id-${i}`,
          templateId: "legacy-system",
          title: `Entry ${i}`,
          updatedAt: new Date().toISOString(),
          sections: { sec: { field: "x".repeat(400) } },
        })),
      };
      const stored = await exportVaultEncrypted("key", largeVault);
      expect(stored.ciphertext.length).toBeGreaterThan(50000);
      const data = await importVaultFromBlob("key", stored);
      expect(data.entries).toHaveLength(300);
      expect(data.entries[0]?.title).toBe("Entry 0");
    });
  });

  describe("createEmptyEntry", () => {
    it("returns entry with id, templateId, title, updatedAt, empty sections", () => {
      const entry = createEmptyEntry("legacy-system", "My Title");
      expect(entry.id).toBeDefined();
      expect(entry.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
      expect(entry.templateId).toBe("legacy-system");
      expect(entry.title).toBe("My Title");
      expect(entry.updatedAt).toBeDefined();
      expect(entry.sections).toEqual({});
    });

    it("uses Untitled when title is empty", () => {
      const entry = createEmptyEntry("t", "");
      expect(entry.title).toBe("Untitled");
    });
  });
});
