import React from "react";
import type { Template, Entry, SectionData } from "../vault-types";

interface TemplateFormProps {
  template: Template;
  entry: Entry;
  onUpdate: (sections: Record<string, SectionData>, title: string) => void | Promise<void>;
  onCancel: () => void;
  onSave: () => void;
  saveLabel?: string;
}

export function TemplateForm({
  template,
  entry,
  onUpdate,
  onCancel,
  onSave,
  saveLabel = "Save",
}: TemplateFormProps) {
  const [title, setTitle] = React.useState(entry.title);
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
    await onUpdate(sections, title);
    onSave();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={styles.titleRow}>
        <label htmlFor="entry-title">Title</label>
        <input
          id="entry-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Entry title…"
          style={styles.titleInput}
        />
      </div>
      {template.sections.map((section) => (
        <fieldset key={section.id} style={styles.section}>
          <legend style={styles.legend}>{section.label}</legend>
          {section.fields.map((field) => {
            const raw = sections[section.id]?.[field.id];
            const valueStr =
              raw !== undefined && raw !== null ? String(raw) : "";
            return (
              <div key={field.id} style={styles.field}>
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
                    style={styles.textarea}
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
                    style={styles.input}
                  />
                )}
              </div>
            );
          })}
        </fieldset>
      ))}
      <div style={styles.actions}>
        <button type="button" onClick={onCancel} style={styles.cancelBtn}>
          Cancel
        </button>
        <button type="submit" style={styles.saveBtn}>
          {saveLabel}
        </button>
      </div>
    </form>
  );
}

const styles: Record<string, React.CSSProperties> = {
  titleRow: {
    marginBottom: "1.5rem",
  },
  titleInput: {
    display: "block",
    width: "100%",
    padding: "0.75rem",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "1rem",
    marginTop: "0.25rem",
  },
  section: {
    marginBottom: "1.5rem",
    padding: "1rem",
    border: "1px solid #eee",
    borderRadius: "6px",
  },
  legend: {
    padding: "0 0.5rem",
    fontWeight: 600,
  },
  field: {
    marginTop: "0.75rem",
  },
  input: {
    display: "block",
    width: "100%",
    padding: "0.5rem 0.75rem",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "1rem",
    marginTop: "0.25rem",
  },
  textarea: {
    display: "block",
    width: "100%",
    padding: "0.5rem 0.75rem",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "1rem",
    marginTop: "0.25rem",
    resize: "vertical",
    minHeight: "4rem",
  },
  actions: {
    display: "flex",
    gap: "0.75rem",
    marginTop: "1.5rem",
  },
  cancelBtn: {
    padding: "0.5rem 1rem",
    background: "transparent",
    border: "1px solid #ccc",
    borderRadius: "6px",
    cursor: "pointer",
  },
  saveBtn: {
    padding: "0.5rem 1rem",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: 500,
  },
};
