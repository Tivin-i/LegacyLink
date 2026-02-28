import React from "react";
import type { Template, Entry, SectionData, Category } from "../vault-types";
import { forms } from "../styles/shared";

interface TemplateFormProps {
  template: Template;
  entry: Entry;
  /** Categories for optional category dropdown. If omitted, category selector is hidden. */
  categories?: Category[];
  onUpdate: (sections: Record<string, SectionData>, title: string, categoryId?: string) => void | Promise<void>;
  onCancel: () => void;
  /** Called after onUpdate completes (e.g. for analytics). Optional. */
  onSave?: () => void;
  saveLabel?: string;
}

export function TemplateForm({
  template,
  entry,
  categories = [],
  onUpdate,
  onCancel,
  onSave,
  saveLabel = "Save",
}: TemplateFormProps) {
  const [title, setTitle] = React.useState(entry.title);
  const [categoryId, setCategoryId] = React.useState(entry.categoryId ?? "");
  const [sections, setSections] = React.useState<Record<string, SectionData>>(
    () => ({ ...entry.sections })
  );

  const updateSection = (sectionId: string, fieldId: string, value: string | number | boolean) => {
    setSections((prev) => ({
      ...prev,
      [sectionId]: {
        ...(prev[sectionId] ?? {}),
        [fieldId]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdate(sections, title, categoryId === "" ? undefined : categoryId);
    onSave?.();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: "1.5rem" }}>
        <label htmlFor="entry-title">Title</label>
        <input
          id="entry-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Entry title…"
          style={forms.titleInput}
        />
      </div>
      {categories.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <label htmlFor="entry-category">Category</label>
          <select
            id="entry-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            style={{ ...forms.input, padding: "0.5rem 0.75rem" }}
            aria-label="Category"
          >
            <option value="">Uncategorized</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}
      {template.sections.map((section) => (
        <fieldset key={section.id} style={forms.fieldset}>
          <legend style={forms.legend}>{section.label}</legend>
          {section.fields.map((field) => {
            const raw = sections[section.id]?.[field.id];
            const valueStr =
              raw !== undefined && raw !== null ? String(raw) : "";
            return (
              <div key={field.id} style={forms.field}>
                <label htmlFor={`${section.id}-${field.id}`}>
                  {field.label}
                  {field.required && " *"}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    id={`${section.id}-${field.id}`}
                    value={valueStr}
                    onChange={(e) =>
                      updateSection(section.id, field.id, e.target.value)
                    }
                    required={field.required}
                    placeholder={field.placeholder ?? "…"}
                    rows={3}
                    style={forms.textarea}
                  />
                ) : (
                  <input
                    id={`${section.id}-${field.id}`}
                    type={
                      field.type === "password"
                        ? "password"
                        : field.type === "url"
                          ? "url"
                          : field.type === "email"
                            ? "email"
                            : field.type === "number"
                              ? "number"
                              : field.type === "date"
                                ? "date"
                                : "text"
                    }
                    value={valueStr}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (field.type === "number") {
                        const n = e.target.value === "" ? 0 : Number(e.target.value);
                        updateSection(section.id, field.id, Number.isNaN(n) ? 0 : n);
                      } else {
                        updateSection(section.id, field.id, v);
                      }
                    }}
                    required={field.required}
                    placeholder={field.placeholder ?? "…"}
                    autoComplete={field.type === "password" ? "off" : undefined}
                    style={forms.input}
                  />
                )}
              </div>
            );
          })}
        </fieldset>
      ))}
      <div style={forms.actions}>
        <button type="button" onClick={onCancel} style={forms.cancel}>
          Cancel
        </button>
        <button type="submit" style={forms.submit}>
          {saveLabel}
        </button>
      </div>
    </form>
  );
}
