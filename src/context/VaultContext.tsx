import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { VaultData, Entry, SectionData } from "../vault-types";
import type { StoredEncryptedBlob } from "../crypto/vault-crypto";
import {
  unlockVault,
  saveVault,
  exportVaultEncrypted,
  importVaultFromBlob,
  createEmptyEntry,
  createAndSaveEmptyVault,
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
    sections: Record<string, SectionData>
  ) => Promise<Entry | undefined>;
  updateEntry: (id: string, updater: (e: Entry) => Entry) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  exportVault: () => Promise<StoredEncryptedBlob | null>;
  importVault: (
    stored: StoredEncryptedBlob
  ) => Promise<{ ok: boolean; error?: string }>;
  registerPasskey: () => Promise<{ ok: boolean; error?: string }>;
}

const VaultContext = createContext<VaultContextValue | null>(null);

const EMPTY_VAULT: VaultData = { version: 1, entries: [] };

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
        await createAndSaveEmptyVault(passphrase);
        setVault({ ...EMPTY_VAULT, entries: [] });
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
        await saveVault(passphrase, data);
        setVault(data);
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
      sections: Record<string, SectionData>
    ): Promise<Entry | undefined> => {
      if (!vault || !passphraseRef) return undefined;
      const entry = createEmptyEntry(templateId, title);
      const fullEntry: Entry = {
        ...entry,
        title,
        sections,
        updatedAt: new Date().toISOString(),
      };
      const next: VaultData = {
        ...vault,
        entries: [...vault.entries, fullEntry],
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
      const entries = vault.entries.map((e) => (e.id === id ? updater(e) : e));
      const next = { ...vault, entries };
      setVault(next);
      await saveVault(passphraseRef.current, next);
    },
    [vault, passphraseRef]
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      if (!vault || !passphraseRef) return;
      const entries = vault.entries.filter((e) => e.id !== id);
      const next = { ...vault, entries };
      setVault(next);
      await saveVault(passphraseRef.current, next);
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
        setVault(data);
        await saveVault(passphraseRef.current, data);
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
      exportVault,
      importVault,
      registerPasskey,
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
      exportVault,
      importVault,
      registerPasskey,
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
