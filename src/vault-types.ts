/**
 * In-memory vault and entry types.
 * See docs/ARCHITECTURE.md for data model.
 */

export interface VaultData {
  version: number;
  entries: Entry[];
}

export interface Entry {
  id: string;
  templateId: string;
  title: string;
  updatedAt: string;
  sections: Record<string, SectionData>;
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
