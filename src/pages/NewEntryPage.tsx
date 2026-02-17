import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { useVault } from "../context/VaultContext";
import { getTemplate, LEGACY_SYSTEM_TEMPLATE_ID } from "../templates";
import { TemplateForm } from "../components/TemplateForm";
import type { SectionData } from "../vault-types";

export function NewEntryPage() {
  const navigate = useNavigate();
  const { addEntry, updateEntry } = useVault();
  const template = getTemplate(LEGACY_SYSTEM_TEMPLATE_ID);

  if (!template) {
    return (
      <main style={styles.main}>
        <p>Template not found.</p>
        <Link to="/entries">Back to list</Link>
      </main>
    );
  }

  const handleCreate = async (sections: Record<string, SectionData>, title: string) => {
    const entry = addEntry(LEGACY_SYSTEM_TEMPLATE_ID, title);
    await updateEntry(entry.id, (e) => ({
      ...e,
      title,
      sections,
      updatedAt: new Date().toISOString(),
    }));
    navigate(`/entries/${entry.id}`, { replace: true });
  };

  const entry = {
    id: "",
    templateId: LEGACY_SYSTEM_TEMPLATE_ID,
    title: "",
    updatedAt: new Date().toISOString(),
    sections: {},
  };

  return (
    <main style={styles.main}>
      <Link to="/entries" style={styles.back}>
        Back to list
      </Link>
      <h1 style={styles.title}>New entry</h1>
      <TemplateForm
        template={template}
        entry={entry}
        onUpdate={async (sections, title) => {
          await handleCreate(sections, title);
        }}
        onCancel={() => navigate("/entries")}
        onSave={() => {}}
        saveLabel="Create"
      />
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    maxWidth: "720px",
    margin: "0 auto",
    padding: "1.5rem 1rem",
  },
  back: {
    color: "#2563eb",
    textDecoration: "none",
    display: "inline-block",
    marginBottom: "1rem",
  },
  title: {
    margin: "0 0 1rem",
    fontSize: "1.5rem",
  },
};
