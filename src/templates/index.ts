import type { Template } from "../vault-types";
import { legacySystemTemplate } from "./legacy-system";

const templates: Template[] = [legacySystemTemplate];

export function getTemplate(id: string): Template | undefined {
  return templates.find((t) => t.id === id);
}

export function getAllTemplates(): Template[] {
  return [...templates];
}

export { legacySystemTemplate, LEGACY_SYSTEM_TEMPLATE_ID } from "./legacy-system";
