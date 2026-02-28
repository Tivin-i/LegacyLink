import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useVault } from "../context/VaultContext";
import { getTemplate } from "../templates";
import { TemplateForm } from "../components/TemplateForm";
import type { SectionData } from "../vault-types";
import { layout, links, typography, buttons } from "../styles/shared";

export function EntryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getEntry, updateEntry, deleteEntry } = useVault();
  const entry = id ? getEntry(id) : undefined;
  const [editing, setEditing] = useState(false);

  if (!entry) {
    return (
      <main style={layout.main}>
        <p>Entry not found.</p>
        <Link to="/entries" style={links.back}>Back to list</Link>
      </main>
    );
  }

  const template = getTemplate(entry.templateId);
  if (!template) {
    return (
      <main style={layout.main}>
        <p>Template not found.</p>
        <Link to="/entries" style={links.back}>Back to list</Link>
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

  const headerStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
    flexWrap: "wrap",
    gap: "0.5rem",
  };
  const sectionStyle: React.CSSProperties = {
    marginBottom: "1.5rem",
    padding: "1rem",
    border: "1px solid #eee",
    borderRadius: "6px",
  };

  if (editing) {
    return (
      <main style={layout.main}>
        <Link to="/entries" style={links.back}>
          Back to list
        </Link>
        <TemplateForm
          template={template}
          entry={entry}
          onUpdate={(sections, title) => handleUpdate(sections, title)}
          onCancel={() => setEditing(false)}
          saveLabel="Save"
        />
      </main>
    );
  }

  return (
    <main style={layout.main}>
      <div style={headerStyle}>
        <Link to="/entries" style={links.back}>
          Back to list
        </Link>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={() => setEditing(true)}
            style={buttons.primary}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={handleDelete}
            style={buttons.danger}
            aria-label="Delete entry"
          >
            Delete
          </button>
        </div>
      </div>
      <h1 style={typography.titleSmall}>{entry.title}</h1>
      <p style={typography.meta}>
        {template.name} · Updated{" "}
        {new Date(entry.updatedAt).toLocaleString()}
      </p>
      {template.sections.map((section) => (
        <section key={section.id} style={sectionStyle}>
          <h2 style={typography.h2}>
            {section.label}
          </h2>
          <dl style={{ margin: 0 }}>
            {section.fields.map((field) => {
              const value = entry.sections[section.id]?.[field.id];
              const display =
                value !== undefined && value !== null && String(value).trim()
                  ? String(value)
                  : "—";
              return (
                <div key={field.id} style={{ marginTop: "0.5rem" }}>
                  <dt style={{ margin: 0, fontSize: "0.875rem", color: "#666" }}>
                    {field.label}
                  </dt>
                  <dd style={{ margin: "0.25rem 0 0", fontSize: "1rem" }}>
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
