import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { VaultData, Entry } from "../vault-types";
import {
  unlockVault,
  saveVault,
  createEmptyEntry,
} from "../vault/vault-service";

interface VaultContextValue {
  isUnlocked: boolean;
  vault: VaultData | null;
  passphraseRef: { current: string } | null;
  unlock: (passphrase: string) => Promise<{ ok: boolean; error?: string }>;
  lock: () => void;
  updateVault: (updater: (d: VaultData) => VaultData) => Promise<void>;
  getEntry: (id: string) => Entry | undefined;
  addEntry: (templateId: string, title: string) => Entry;
  updateEntry: (id: string, updater: (e: Entry) => Entry) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
}

const VaultContext = createContext<VaultContextValue | null>(null);

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const [vault, setVault] = useState<VaultData | null>(null);
  const [passphraseRef, setPassphraseRef] = useState<{ current: string } | null>(
    null
  );

  const isUnlocked = vault !== null;

  const unlock = useCallback(
    async (passphrase: string): Promise<{ ok: boolean; error?: string }> => {
      try {
        const data = await unlockVault(passphrase);
        setVault(data);
        setPassphraseRef({ current: passphrase });
        return { ok: true };
      } catch (e) {
        const message = e instanceof Error ? e.message : "Unlock failed";
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

  const value = useMemo<VaultContextValue>(
    () => ({
      isUnlocked,
      vault,
      passphraseRef,
      unlock,
      lock,
      updateVault,
      getEntry,
      addEntry,
      updateEntry,
      deleteEntry,
    }),
    [
      isUnlocked,
      vault,
      passphraseRef,
      unlock,
      lock,
      updateVault,
      getEntry,
      addEntry,
      updateEntry,
      deleteEntry,
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
