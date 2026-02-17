import { openDB, type IDBPDatabase } from "idb";
import type { StoredEncryptedBlob } from "../crypto/vault-crypto";

const DB_NAME = "legacylink-v1";
const STORE_VAULT = "vault";
const STORE_META = "meta";
const KEY_VAULT = "vault";

export interface LegacyLinkDB {
  [STORE_VAULT]: { key: typeof KEY_VAULT; value: StoredEncryptedBlob };
  [STORE_META]: { key: string; value: unknown };
}

function getDB(): Promise<IDBPDatabase<LegacyLinkDB>> {
  return openDB<LegacyLinkDB>(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_VAULT)) {
        db.createObjectStore(STORE_VAULT);
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META);
      }
    },
  });
}

export async function readVaultBlob(): Promise<StoredEncryptedBlob | null> {
  const db = await getDB();
  const value = await db.get(STORE_VAULT, KEY_VAULT);
  db.close();
  return value ?? null;
}

export async function writeVaultBlob(blob: StoredEncryptedBlob): Promise<void> {
  const db = await getDB();
  await db.put(STORE_VAULT, blob, KEY_VAULT);
  db.close();
}

export async function clearVault(): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_VAULT, KEY_VAULT);
  db.close();
}

export async function getMeta<T>(key: string): Promise<T | undefined> {
  const db = await getDB();
  const value = await db.get(STORE_META, key);
  db.close();
  return value as T | undefined;
}

export async function setMeta<T>(key: string, value: T): Promise<void> {
  const db = await getDB();
  await db.put(STORE_META, value, key);
  db.close();
}
