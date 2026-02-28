import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { VaultData, Entry, SectionData, Category, HistoryEntry, UploadedKey } from "../vault-types";
import type { StoredEncryptedBlob } from "../crypto/vault-crypto";
import {
  unlockVault,
  saveVault,
  exportVaultEncrypted,
  importVaultFromBlob,
  createEmptyEntry,
  createAndSaveEmptyVault,
  appendHistory,
} from "../vault/vault-service";
import { readVaultBlob } from "../storage/db";
import { registerPasskey as registerPasskeyAuth } from "../auth/passkey";

interface VaultContextValue {
  isUnlocked: boolean;
  vault: VaultData | null;
  /** True if a store exists locally; false if none; null while loading. */
  hasExistingStore: boolean | null;
  unlock: (passphrase: string) => Promise<{ ok: boolean; error?: string }>;
  lock: () => void;
  /** Create a new empty store and unlock with the given passphrase. */
  createNewStore: (passphrase: string) => Promise<{ ok: boolean; error?: string }>;
  /** Import an existing store from file and unlock; verifies key by decrypting. */
  importExistingStore: (
    stored: StoredEncryptedBlob,
    passphrase: string
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
  importVault: (
    stored: StoredEncryptedBlob
  ) => Promise<{ ok: boolean; error?: string }>;
  registerPasskey: () => Promise<{ ok: boolean; error?: string }>;
  /** For Successors guide (vault-level). */
  successorGuide: string;
  updateSuccessorGuide: (text: string) => Promise<void>;
  /** User AKA nickname (e.g. for Author display). */
  userAka: string;
  updateUserAka: (aka: string) => Promise<void>;
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
  const [passphraseRef, setPassphraseRef] = useState<{ current: string } | null>(
    null
  );
  const [hasExistingStore, setHasExistingStore] = useState<boolean | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    readVaultBlob().then((blob) => {
      if (!cancelled) setHasExistingStore(blob != null);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const isUnlocked = vault !== null;

  const unlock = useCallback(
    async (passphrase: string): Promise<{ ok: boolean; error?: string }> => {
      try {
        const data = await unlockVault(passphrase);
        setVault(data);
        setPassphraseRef({ current: passphrase });
        setHasExistingStore(true);
        return { ok: true };
      } catch (e) {
        const message = e instanceof Error ? e.message : "Unlock failed";
        return { ok: false, error: message };
      }
    },
    []
  );

  const createNewStore = useCallback(
    async (passphrase: string): Promise<{ ok: boolean; error?: string }> => {
      try {
        const initial = await createAndSaveEmptyVault(passphrase);
        setVault(initial);
        setPassphraseRef({ current: passphrase });
        setHasExistingStore(true);
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
      stored: StoredEncryptedBlob,
      passphrase: string
    ): Promise<{ ok: boolean; error?: string }> => {
      try {
        const data = await importVaultFromBlob(passphrase, stored);
        const withHistory: VaultData = {
          ...data,
          history: appendHistory(data.history, { action: "vault_imported" }),
        };
        await saveVault(passphrase, withHistory);
        setVault(withHistory);
        setPassphraseRef({ current: passphrase });
        setHasExistingStore(true);
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
    setVault(null);
    setPassphraseRef(null);
  }, []);

  const updateVault = useCallback(
    async (updater: (d: VaultData) => VaultData) => {
      if (!vault || !passphraseRef) return;
      const next = updater(vault);
      setVault(next);
      await saveVault(passphraseRef.current, next);
    },
    [vault, passphraseRef]
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
      saveVault(passphraseRef!.current, next).catch(() => {});
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
      await saveVault(passphraseRef.current, next);
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
      await saveVault(passphraseRef.current, next);
    },
    [vault, passphraseRef]
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
      await saveVault(passphraseRef.current, next);
    },
    [vault, passphraseRef]
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
      await saveVault(passphraseRef.current, next);
    },
    [vault, passphraseRef]
  );

  const renameCategory = useCallback(
    async (id: string, name: string) => {
      if (!vault || !passphraseRef) return;
      const cats = (vault.categories ?? []).map((c) =>
        c.id === id ? { ...c, name: name.trim() } : c
      );
      const next = { ...vault, categories: cats };
      setVault(next);
      await saveVault(passphraseRef.current, next);
    },
    [vault, passphraseRef]
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
      await saveVault(passphraseRef.current, next);
      return { ok: true };
    },
    [vault, passphraseRef]
  );

  const exportVault = useCallback(async (): Promise<StoredEncryptedBlob | null> => {
    if (!vault || !passphraseRef) return null;
    return exportVaultEncrypted(passphraseRef.current, vault);
  }, [vault, passphraseRef]);

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
        await saveVault(passphraseRef.current, withHistory);
        return { ok: true };
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Import failed. Wrong key or invalid file.";
        return { ok: false, error: message };
      }
    },
    [passphraseRef]
  );

  const registerPasskey = useCallback(async (): Promise<{
    ok: boolean;
    error?: string;
  }> => {
    if (!passphraseRef?.current)
      return { ok: false, error: "Vault is locked." };
    return registerPasskeyAuth(passphraseRef.current);
  }, [passphraseRef]);

  const successorGuide = vault?.successorGuide ?? "";
  const updateSuccessorGuide = useCallback(
    async (text: string) => {
      if (!vault || !passphraseRef) return;
      const next = { ...vault, successorGuide: text };
      setVault(next);
      await saveVault(passphraseRef.current, next);
    },
    [vault, passphraseRef]
  );

  const userAka = vault?.userAka ?? "";
  const updateUserAka = useCallback(
    async (aka: string) => {
      if (!vault || !passphraseRef) return;
      const next = { ...vault, userAka: aka.trim() };
      setVault(next);
      await saveVault(passphraseRef.current, next);
    },
    [vault, passphraseRef]
  );

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
      await saveVault(passphraseRef.current, next);
    },
    [vault, passphraseRef]
  );

  const deleteUploadedKey = useCallback(
    async (id: string) => {
      if (!vault || !passphraseRef) return;
      const next: VaultData = {
        ...vault,
        uploadedKeys: (vault.uploadedKeys ?? []).filter((k) => k.id !== id),
      };
      setVault(next);
      await saveVault(passphraseRef.current, next);
    },
    [vault, passphraseRef]
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
      unlock,
      lock,
      createNewStore,
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
      importVault,
      registerPasskey,
      successorGuide,
      updateSuccessorGuide,
      userAka,
      updateUserAka,
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
      unlock,
      lock,
      createNewStore,
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
      importVault,
      registerPasskey,
      successorGuide,
      updateSuccessorGuide,
      userAka,
      updateUserAka,
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
