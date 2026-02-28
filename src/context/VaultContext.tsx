import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { VaultData, Entry, SectionData, Category, HistoryEntry, UploadedKey } from "../vault-types";
import type { DecryptedVaultPayload } from "../vault-types";
import type { StoredEncryptedBlob } from "../crypto/vault-crypto";
import {
  exportVaultEncrypted,
  importVaultFromBlob,
  createEmptyEntry,
  createInitialPayload,
  appendHistory,
  migrateVault,
} from "../vault/vault-service";
import {
  readVaultFromFile,
  writeVaultToHandle,
  buildPayloadForSave,
} from "../storage/file-vault-storage";

interface VaultContextValue {
  isUnlocked: boolean;
  vault: VaultData | null;
  /** No local store is loaded on app start; user must import or create. Kept for compatibility. */
  hasExistingStore: boolean | null;
  lock: () => void;
  /** Create a new vault file at the given handle and unlock. */
  createNewStoreWithHandle: (
    handle: FileSystemFileHandle,
    passphrase: string
  ) => Promise<{ ok: boolean; error?: string }>;
  /** Import vault from file and unlock. Pass handle if available (e.g. from showOpenFilePicker) to allow saving back. */
  importExistingStore: (
    file: File,
    passphrase: string,
    handle?: FileSystemFileHandle | null
  ) => Promise<{ ok: boolean; error?: string }>;
  updateVault: (updater: (d: VaultData) => VaultData) => Promise<void>;
  getEntry: (id: string) => Entry | undefined;
  /** Add empty entry then edit (e.g. for future flows). Prefer createEntry for new-entry form. */
  addEntry: (templateId: string, title: string) => Entry;
  /** Create one entry with full data in a single save (use for new-entry flow). */
  createEntry: (
    templateId: string,
    title: string,
    sections: Record<string, SectionData>,
    categoryId?: string
  ) => Promise<Entry | undefined>;
  updateEntry: (id: string, updater: (e: Entry) => Entry) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  /** Categories (from vault). */
  categories: Category[];
  addCategory: (name: string) => Promise<void>;
  renameCategory: (id: string, name: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<{ ok: boolean; error?: string }>;
  exportVault: () => Promise<StoredEncryptedBlob | null>;
  /** Save a copy of the vault to a chosen file (save picker). Use when File System Access API is available. */
  saveCopyToHandle: (handle: FileSystemFileHandle) => Promise<{ ok: boolean; error?: string }>;
  importVault: (
    stored: StoredEncryptedBlob
  ) => Promise<{ ok: boolean; error?: string }>;
  /** For Successors guide (vault-level). */
  successorGuide: string;
  updateSuccessorGuide: (text: string) => Promise<void>;
  /** User AKA nickname (e.g. for Author display). */
  userAka: string;
  updateUserAka: (aka: string) => Promise<void>;
  /** Max versions to keep in vault file. Affects file size. */
  versionHistoryLimit: number;
  updateVersionHistoryLimit: (limit: number) => Promise<void>;
  /** Past version snapshots (newest first). Empty if versioning disabled or no saves yet. */
  versionSnapshots: VaultData[];
  /** Restore a past version as current and save. Index into versionSnapshots (0 = newest). */
  restoreVersion: (index: number) => Promise<void>;
  /** Approximate size in bytes of the vault file as it would be saved now. Null if not unlocked. */
  estimatedVaultSizeBytes: number | null;
  /** History log (newest first). */
  history: HistoryEntry[];
  /** Uploaded keys (SSH/certs). */
  uploadedKeys: UploadedKey[];
  addUploadedKey: (name: string, type: "ssh" | "cert", contentBase64: string, mimeType?: string) => Promise<void>;
  deleteUploadedKey: (id: string) => Promise<void>;
  getUploadedKey: (id: string) => UploadedKey | undefined;
}

const VaultContext = createContext<VaultContextValue | null>(null);

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const [vault, setVault] = useState<VaultData | null>(null);
  const [passphraseRef, setPassphraseRef] = useState<{ current: string } | null>(null);
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null);
  const [lastPayload, setLastPayload] = useState<DecryptedVaultPayload | null>(null);
  /** No db load; user must import or create. Always false so index shows choice. */
  const hasExistingStore = false;

  const isUnlocked = vault !== null;

  const persistFile = useCallback(
    async (data: VaultData) => {
      if (!fileHandle || !passphraseRef) return;
      const nextPayload = buildPayloadForSave(lastPayload, data);
      await writeVaultToHandle(fileHandle, passphraseRef.current, nextPayload);
      setLastPayload(nextPayload);
    },
    [fileHandle, passphraseRef, lastPayload]
  );

  const createNewStoreWithHandle = useCallback(
    async (
      handle: FileSystemFileHandle,
      passphrase: string
    ): Promise<{ ok: boolean; error?: string }> => {
      try {
        const payload = createInitialPayload();
        await writeVaultToHandle(handle, passphrase, payload);
        setVault(payload.current);
        setLastPayload(payload);
        setPassphraseRef({ current: passphrase });
        setFileHandle(handle);
        return { ok: true };
      } catch (e) {
        const message = e instanceof Error ? e.message : "Create store failed";
        return { ok: false, error: message };
      }
    },
    []
  );

  const importExistingStore = useCallback(
    async (
      file: File,
      passphrase: string,
      handle?: FileSystemFileHandle | null
    ): Promise<{ ok: boolean; error?: string }> => {
      try {
        const payload = await readVaultFromFile(file, passphrase);
        const current = migrateVault(payload.current);
        const withHistory: VaultData = {
          ...current,
          history: appendHistory(current.history, { action: "vault_imported" }),
        };
        const mergedPayload: DecryptedVaultPayload = {
          ...payload,
          current: withHistory,
        };
        setVault(withHistory);
        setLastPayload(mergedPayload);
        setPassphraseRef({ current: passphrase });
        setFileHandle(handle ?? null);
        return { ok: true };
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Wrong key or invalid file.";
        return { ok: false, error: message };
      }
    },
    []
  );

  const lock = useCallback(() => {
    setPassphraseRef((prev) => {
      if (prev) prev.current = "";
      return null;
    });
    setVault(null);
    setFileHandle(null);
    setLastPayload(null);
  }, []);

  const updateVault = useCallback(
    async (updater: (d: VaultData) => VaultData) => {
      if (!vault || !passphraseRef) return;
      const next = updater(vault);
      setVault(next);
      await persistFile(next);
    },
    [vault, passphraseRef, persistFile]
  );

  const getEntry = useCallback(
    (id: string): Entry | undefined => {
      return vault?.entries.find((e) => e.id === id);
    },
    [vault]
  );

  const addEntry = useCallback(
    (templateId: string, title: string): Entry => {
      const entry = createEmptyEntry(templateId, title);
      if (!vault) return entry;
      const next: VaultData = {
        ...vault,
        entries: [...vault.entries, entry],
      };
      setVault(next);
      persistFile(next).catch((err) => {
        console.error("Vault save failed", err);
      });
      return entry;
    },
    [vault, passphraseRef]
  );

  const createEntry = useCallback(
    async (
      templateId: string,
      title: string,
      sections: Record<string, SectionData>,
      categoryId?: string
    ): Promise<Entry | undefined> => {
      if (!vault || !passphraseRef) return undefined;
      const entry = createEmptyEntry(templateId, title, categoryId);
      const fullEntry: Entry = {
        ...entry,
        title,
        sections,
        updatedAt: new Date().toISOString(),
        ...(categoryId != null && categoryId !== "" ? { categoryId } : {}),
      };
      const next: VaultData = {
        ...vault,
        entries: [...vault.entries, fullEntry],
        history: appendHistory(vault.history, {
          action: "entry_created",
          entryId: fullEntry.id,
          entryTitle: fullEntry.title,
        }),
      };
      setVault(next);
      await persistFile(next);
      return fullEntry;
    },
    [vault, passphraseRef]
  );

  const updateEntry = useCallback(
    async (id: string, updater: (e: Entry) => Entry) => {
      if (!vault || !passphraseRef) return;
      const prev = vault.entries.find((e) => e.id === id);
      const entries = vault.entries.map((e) => (e.id === id ? updater(e) : e));
      const updated = entries.find((e) => e.id === id);
      const next: VaultData = {
        ...vault,
        entries,
        history: appendHistory(vault.history, {
          action: "entry_updated",
          entryId: id,
          entryTitle: updated?.title ?? prev?.title,
        }),
      };
      setVault(next);
      await persistFile(next);
    },
    [vault, passphraseRef, persistFile]
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      if (!vault || !passphraseRef) return;
      const prev = vault.entries.find((e) => e.id === id);
      const entries = vault.entries.filter((e) => e.id !== id);
      const next: VaultData = {
        ...vault,
        entries,
        history: appendHistory(vault.history, {
          action: "entry_deleted",
          entryId: id,
          entryTitle: prev?.title,
        }),
      };
      setVault(next);
      await persistFile(next);
    },
    [vault, passphraseRef, persistFile]
  );

  const categories = vault?.categories ?? [];

  const addCategory = useCallback(
    async (name: string) => {
      if (!vault || !passphraseRef) return;
      const id = crypto.randomUUID();
      const next: VaultData = {
        ...vault,
        categories: [...(vault.categories ?? []), { id, name: name.trim() }],
      };
      setVault(next);
      await persistFile(next);
    },
    [vault, passphraseRef, persistFile]
  );

  const renameCategory = useCallback(
    async (id: string, name: string) => {
      if (!vault || !passphraseRef) return;
      const cats = (vault.categories ?? []).map((c) =>
        c.id === id ? { ...c, name: name.trim() } : c
      );
      const next = { ...vault, categories: cats };
      setVault(next);
      await persistFile(next);
    },
    [vault, passphraseRef, persistFile]
  );

  const deleteCategory = useCallback(
    async (id: string): Promise<{ ok: boolean; error?: string }> => {
      if (!vault || !passphraseRef) return { ok: false, error: "Vault not ready." };
      const inUse = vault.entries.some((e) => e.categoryId === id);
      if (inUse)
        return { ok: false, error: "Category is in use. Remove it from entries first." };
      const next: VaultData = {
        ...vault,
        categories: (vault.categories ?? []).filter((c) => c.id !== id),
      };
      setVault(next);
      await persistFile(next);
      return { ok: true };
    },
    [vault, passphraseRef, persistFile]
  );

  const exportVault = useCallback(async (): Promise<StoredEncryptedBlob | null> => {
    if (!vault || !passphraseRef) return null;
    return exportVaultEncrypted(passphraseRef.current, vault);
  }, [vault, passphraseRef]);

  const saveCopyToHandle = useCallback(
    async (handle: FileSystemFileHandle): Promise<{ ok: boolean; error?: string }> => {
      if (!vault || !passphraseRef) return { ok: false, error: "Vault is locked." };
      try {
        const payload: DecryptedVaultPayload = {
          current: vault,
          versions: [],
          versionHistoryLimit: vault.versionHistoryLimit ?? 10,
        };
        await writeVaultToHandle(handle, passphraseRef.current, payload);
        return { ok: true };
      } catch (e) {
        const message = e instanceof Error ? e.message : "Save copy failed.";
        return { ok: false, error: message };
      }
    },
    [vault, passphraseRef]
  );

  const importVault = useCallback(
    async (
      stored: StoredEncryptedBlob
    ): Promise<{ ok: boolean; error?: string }> => {
      if (!passphraseRef) return { ok: false, error: "Vault is locked." };
      try {
        const data = await importVaultFromBlob(passphraseRef.current, stored);
        const withHistory: VaultData = {
          ...data,
          history: appendHistory(data.history, { action: "vault_imported" }),
        };
        setVault(withHistory);
        setLastPayload((prev) =>
          prev
            ? { ...prev, current: withHistory }
            : { current: withHistory, versions: [], versionHistoryLimit: 10 }
        );
        if (fileHandle && passphraseRef) {
          const nextPayload = buildPayloadForSave(
            { current: withHistory, versions: [], versionHistoryLimit: 10 },
            withHistory
          );
          await writeVaultToHandle(fileHandle, passphraseRef.current, nextPayload);
          setLastPayload(nextPayload);
        }
        return { ok: true };
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Import failed. Wrong key or invalid file.";
        return { ok: false, error: message };
      }
    },
    [passphraseRef, fileHandle]
  );

  const successorGuide = vault?.successorGuide ?? "";
  const updateSuccessorGuide = useCallback(
    async (text: string) => {
      if (!vault || !passphraseRef) return;
      const next = { ...vault, successorGuide: text };
      setVault(next);
      await persistFile(next);
    },
    [vault, passphraseRef, persistFile]
  );

  const userAka = vault?.userAka ?? "";
  const updateUserAka = useCallback(
    async (aka: string) => {
      if (!vault || !passphraseRef) return;
      const next = { ...vault, userAka: aka.trim() };
      setVault(next);
      await persistFile(next);
    },
    [vault, passphraseRef, persistFile]
  );

  const versionHistoryLimit = vault?.versionHistoryLimit ?? 10;
  const updateVersionHistoryLimit = useCallback(
    async (limit: number) => {
      if (!vault || !passphraseRef) return;
      const n = Math.max(0, Math.min(100, Math.round(limit)));
      const next = { ...vault, versionHistoryLimit: n };
      setVault(next);
      await persistFile(next);
    },
    [vault, passphraseRef, persistFile]
  );

  const versionSnapshots = lastPayload?.versions ?? [];

  const restoreVersion = useCallback(
    async (index: number) => {
      if (!vault || !passphraseRef || !lastPayload) return;
      const snapshots = lastPayload.versions;
      if (index < 0 || index >= snapshots.length) return;
      const restored = snapshots[index];
      if (!restored) return;
      setVault(restored);
      await persistFile(restored);
    },
    [vault, passphraseRef, lastPayload, persistFile]
  );

  const estimatedVaultSizeBytes = useMemo(() => {
    if (!vault || !lastPayload) return null;
    try {
      const nextPayload = buildPayloadForSave(lastPayload, vault);
      const json = JSON.stringify(nextPayload);
      return new Blob([json]).size;
    } catch {
      return null;
    }
  }, [vault, lastPayload]);

  const history = vault?.history ?? [];
  const uploadedKeys = vault?.uploadedKeys ?? [];

  const addUploadedKey = useCallback(
    async (name: string, type: "ssh" | "cert", contentBase64: string, mimeType?: string) => {
      if (!vault || !passphraseRef) return;
      const key: UploadedKey = {
        id: crypto.randomUUID(),
        name,
        type,
        contentBase64,
        uploadedAt: new Date().toISOString(),
        ...(mimeType != null ? { mimeType } : {}),
      };
      const next: VaultData = {
        ...vault,
        uploadedKeys: [...(vault.uploadedKeys ?? []), key],
      };
      setVault(next);
      await persistFile(next);
    },
    [vault, passphraseRef, persistFile]
  );

  const deleteUploadedKey = useCallback(
    async (id: string) => {
      if (!vault || !passphraseRef) return;
      const next: VaultData = {
        ...vault,
        uploadedKeys: (vault.uploadedKeys ?? []).filter((k) => k.id !== id),
      };
      setVault(next);
      await persistFile(next);
    },
    [vault, passphraseRef, persistFile]
  );

  const getUploadedKey = useCallback(
    (id: string): UploadedKey | undefined => {
      return vault?.uploadedKeys?.find((k) => k.id === id);
    },
    [vault]
  );

  const value = useMemo<VaultContextValue>(
    () => ({
      isUnlocked,
      vault,
      hasExistingStore,
      lock,
      createNewStoreWithHandle,
      importExistingStore,
      updateVault,
      getEntry,
      addEntry,
      createEntry,
      updateEntry,
      deleteEntry,
      categories,
      addCategory,
      renameCategory,
      deleteCategory,
      exportVault,
      saveCopyToHandle,
      importVault,
      successorGuide,
      updateSuccessorGuide,
      userAka,
      updateUserAka,
      versionHistoryLimit,
      updateVersionHistoryLimit,
      versionSnapshots,
      restoreVersion,
      estimatedVaultSizeBytes,
      history,
      uploadedKeys,
      addUploadedKey,
      deleteUploadedKey,
      getUploadedKey,
    }),
    [
      isUnlocked,
      vault,
      hasExistingStore,
      lock,
      createNewStoreWithHandle,
      importExistingStore,
      updateVault,
      getEntry,
      addEntry,
      createEntry,
      updateEntry,
      deleteEntry,
      categories,
      addCategory,
      renameCategory,
      deleteCategory,
      exportVault,
      saveCopyToHandle,
      importVault,
      successorGuide,
      updateSuccessorGuide,
      userAka,
      updateUserAka,
      versionHistoryLimit,
      updateVersionHistoryLimit,
      versionSnapshots,
      restoreVersion,
      estimatedVaultSizeBytes,
      history,
      uploadedKeys,
      addUploadedKey,
      deleteUploadedKey,
      getUploadedKey,
    ]
  );

  return (
    <VaultContext.Provider value={value}>{children}</VaultContext.Provider>
  );
}

export function useVault(): VaultContextValue {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error("useVault must be used within VaultProvider");
  return ctx;
}
