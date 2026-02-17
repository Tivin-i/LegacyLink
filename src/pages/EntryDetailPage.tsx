import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useVault } from "../context/VaultContext";
import { getTemplate } from "../templates";
import { TemplateForm } from "../components/TemplateForm";
import type { SectionData } from "../vault-types";

export function EntryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getEntry, updateEntry, deleteEntry } = useVault();
  const entry = id ? getEntry(id) : undefined;
  const [editing, setEditing] = useState(false);

  if (!entry) {
    return (
      <main style={styles.main}>
        <p>Entry not found.</p>
        <Link to="/entries">Back to list</Link>
      </main>
    );
  }

  const template = getTemplate(entry.templateId);
  if (!template) {
    return (
      <main style={styles.main}>
        <p>Template not found.</p>
        <Link to="/entries">Back to list</Link>
      </main>
    );
  }

  const handleUpdate = async (sections: Record<string, SectionData>, title: string) => {
    await updateEntry(entry.id, (e) => ({
      ...e,
      title,
      sections,
      updatedAt: new Date().toISOString(),
    }));
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this entry? This cannot be undone.")) return;
    await deleteEntry(entry.id);
    navigate("/entries", { replace: true });
  };

  if (editing) {
    return (
      <main style={styles.main}>
        <Link to="/entries" style={styles.back}>
          Back to list
        </Link>
        <TemplateForm
          template={template}
          entry={entry}
          onUpdate={(sections, title) => handleUpdate(sections, title)}
          onCancel={() => setEditing(false)}
          onSave={() => {}}
          saveLabel="Save"
        />
      </main>
    );
  }

  return (
    <main style={styles.main}>
      <div style={styles.header}>
        <Link to="/entries" style={styles.back}>
          Back to list
        </Link>
        <div style={styles.actions}>
          <button
            type="button"
            onClick={() => setEditing(true)}
            style={styles.button}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={handleDelete}
            style={styles.deleteButton}
            aria-label="Delete entry"
          >
            Delete
          </button>
        </div>
      </div>
      <h1 style={styles.title}>{entry.title}</h1>
      <p style={styles.meta}>
        {template.name} · Updated{" "}
        {new Date(entry.updatedAt).toLocaleString()}
      </p>
      {template.sections.map((section) => (
        <section key={section.id} style={styles.section}>
          <h2 style={styles.sectionTitle}>{section.label}</h2>
          <dl style={styles.dl}>
            {section.fields.map((field) => {
              const value = entry.sections[section.id]?.[field.id];
              const display =
                value !== undefined && value !== null && String(value).trim()
                  ? String(value)
                  : "—";
              return (
                <div key={field.id} style={styles.row}>
                  <dt style={styles.dt}>{field.label}</dt>
                  <dd style={styles.dd}>
                    {field.type === "password" ? "••••••••" : display}
                  </dd>
                </div>
              );
            })}
          </dl>
        </section>
      ))}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    maxWidth: "720px",
    margin: "0 auto",
    padding: "1.5rem 1rem",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
    flexWrap: "wrap",
    gap: "0.5rem",
  },
  back: {
    color: "#2563eb",
    textDecoration: "none",
  },
  actions: {
    display: "flex",
    gap: "0.5rem",
  },
  button: {
    padding: "0.5rem 0.75rem",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  deleteButton: {
    padding: "0.5rem 0.75rem",
    background: "transparent",
    color: "#b91c1c",
    border: "1px solid #b91c1c",
    borderRadius: "6px",
    cursor: "pointer",
  },
  title: {
    margin: "0 0 0.25rem",
    fontSize: "1.5rem",
  },
  meta: {
    margin: "0 0 1.5rem",
    color: "#666",
    fontSize: "0.9375rem",
  },
  section: {
    marginBottom: "1.5rem",
    padding: "1rem",
    border: "1px solid #eee",
    borderRadius: "6px",
  },
  sectionTitle: {
    margin: "0 0 0.75rem",
    fontSize: "1.125rem",
    fontWeight: 600,
  },
  dl: {
    margin: 0,
  },
  row: {
    marginTop: "0.5rem",
  },
  dt: {
    margin: 0,
    fontSize: "0.875rem",
    color: "#666",
  },
  dd: {
    margin: "0.25rem 0 0",
    fontSize: "1rem",
  },
};
