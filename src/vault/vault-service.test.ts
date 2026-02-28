import { describe, it, expect, vi, beforeEach } from "vitest";
import type { StoredEncryptedBlob } from "../crypto/vault-crypto";
import {
  unlockVault,
  saveVault,
  createAndSaveEmptyVault,
  importVaultFromBlob,
  createEmptyEntry,
  exportVaultEncrypted,
} from "./vault-service";
import type { VaultData } from "../vault-types";

const store = vi.hoisted(() => ({ blob: null as StoredEncryptedBlob | null }));

vi.mock("../storage/db", () => ({
  readVaultBlob: () => Promise.resolve(store.blob),
  writeVaultBlob: (b: StoredEncryptedBlob) => {
    store.blob = b;
    return Promise.resolve();
  },
  clearVault: () => {
    store.blob = null;
    return Promise.resolve();
  },
}));

describe("vault-service", () => {
  beforeEach(() => {
    store.blob = null;
  });

  describe("unlockVault", () => {
    it("returns empty vault when no store exists", async () => {
      const data = await unlockVault("any-key");
      expect(data.version).toBe(3);
      expect(data.entries).toEqual([]);
      expect(data.categories).toEqual([]);
      expect(data.history).toEqual([]);
    });

    it("decrypts and returns vault when store exists and key is correct", async () => {
      const vault: VaultData = {
        version: 1,
        entries: [
          {
            id: "e1",
            templateId: "legacy-system",
            title: "First",
            updatedAt: new Date().toISOString(),
            sections: {},
          },
        ],
      };
      await saveVault("secret", vault);
      const data = await unlockVault("secret");
      expect(data.version).toBe(3);
      expect(data.categories).toEqual([]);
      expect(data.history).toBeDefined();
      expect(data.entries).toHaveLength(1);
      expect(data.entries[0]?.title).toBe("First");
    });

    it("throws when key is wrong", async () => {
      await saveVault("correct", { version: 1, entries: [] });
      await expect(unlockVault("wrong")).rejects.toThrow();
    });
  });

  describe("saveVault", () => {
    it("persists vault so unlockVault can read it", async () => {
      const vault: VaultData = { version: 1, entries: [] };
      await saveVault("key", vault);
      expect(store.blob).not.toBeNull();
      const data = await unlockVault("key");
      expect(data.entries).toHaveLength(0);
    });
  });

  describe("createAndSaveEmptyVault", () => {
    it("creates and persists empty store; unlock with same key returns empty vault", async () => {
      await createAndSaveEmptyVault("new-key");
      expect(store.blob).not.toBeNull();
      const data = await unlockVault("new-key");
      expect(data.version).toBe(3);
      expect(data.entries).toEqual([]);
      expect(data.categories).toEqual([]);
      expect(data.history).toHaveLength(1);
      expect(data.history?.[0]?.action).toBe("store_created");
    });

    it("wrong key cannot unlock the created store", async () => {
      await createAndSaveEmptyVault("new-key");
      await expect(unlockVault("other-key")).rejects.toThrow();
    });
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
