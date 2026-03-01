/**
 * In-memory vault and entry types.
 * See docs/ARCHITECTURE.md for data model.
 */

export interface Category {
  id: string;
  name: string;
}

export type HistoryAction =
  | "store_created"
  | "vault_imported"
  | "entry_created"
  | "entry_updated"
  | "entry_deleted";

export interface HistoryEntry {
  at: string;
  action: HistoryAction;
  entryId?: string;
  entryTitle?: string;
  summary?: string;
}

export interface UploadedKey {
  id: string;
  name: string;
  type: "ssh" | "cert";
  mimeType?: string;
  contentBase64: string;
  uploadedAt: string;
}

export interface VaultData {
  version: number;
  entries: Entry[];
  /** Categories for grouping entries. Default []. Vault version 2+. */
  categories?: Category[];
  /** Optional guide for successors. Editable when unlocked. */
  successorGuide?: string;
  /** Append-only change log. Capped length. */
  history?: HistoryEntry[];
  /** Uploaded SSH keys and certificates (encrypted with vault). */
  uploadedKeys?: UploadedKey[];
  /** User's AKA nickname (e.g. for "Author" display). Optional. */
  userAka?: string;
  /** Max number of version snapshots to keep in file. Stored in encrypted payload. Default 10. */
  versionHistoryLimit?: number;
  /** Auto-lock timeout in minutes. 0 = disabled. Default 0. */
  autoLockMinutes?: number;
  /** Salt length in bytes for key derivation. 16 or 32. Default 16. */
  saltLength?: number;
}

/**
 * Decrypted payload of the vault file (format 2).
 * The entire file is encrypted as one blob; this is the plaintext structure.
 */
export interface DecryptedVaultPayload {
  /** Current vault state. */
  current: VaultData;
  /** Past snapshots (newest first). Trimmed to versionHistoryLimit on save. */
  versions: VaultData[];
  /** Max number of versions to keep. Stored in encrypted payload only. */
  versionHistoryLimit: number;
}

export interface Entry {
  id: string;
  templateId: string;
  title: string;
  updatedAt: string;
  sections: Record<string, SectionData>;
  /** Optional category. Uncategorized if omitted. */
  categoryId?: string;
}

export type SectionData = Record<string, string | number | boolean>;

export interface TemplateField {
  id: string;
  label: string;
  type: "text" | "textarea" | "password" | "url" | "email" | "number" | "date";
  required?: boolean;
  placeholder?: string;
}

export interface TemplateSection {
  id: string;
  label: string;
  fields: TemplateField[];
}

export interface Template {
  id: string;
  name: string;
  sections: TemplateSection[];
}
