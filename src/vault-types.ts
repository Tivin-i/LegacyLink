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
