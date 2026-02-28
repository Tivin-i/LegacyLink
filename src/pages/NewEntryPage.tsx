import { useNavigate, Link } from "react-router-dom";
import { useVault } from "../context/VaultContext";
import { getTemplate, LEGACY_SYSTEM_TEMPLATE_ID } from "../templates";
import { TemplateForm } from "../components/TemplateForm";
import type { SectionData } from "../vault-types";
import { layout, links, typography } from "../styles/shared";

export function NewEntryPage() {
  const navigate = useNavigate();
  const { createEntry } = useVault();
  const template = getTemplate(LEGACY_SYSTEM_TEMPLATE_ID);

  if (!template) {
    return (
      <main style={layout.main}>
        <p>Template not found.</p>
        <Link to="/entries" style={links.back}>Back to list</Link>
      </main>
    );
  }

  const handleCreate = async (sections: Record<string, SectionData>, title: string) => {
    const entry = await createEntry(LEGACY_SYSTEM_TEMPLATE_ID, title, sections);
    if (entry) navigate(`/entries/${entry.id}`, { replace: true });
  };

  const entry = {
    id: "",
    templateId: LEGACY_SYSTEM_TEMPLATE_ID,
    title: "",
    updatedAt: new Date().toISOString(),
    sections: {},
  };

  return (
    <main style={layout.main}>
      <Link to="/entries" style={links.back}>
        Back to list
      </Link>
      <h1 style={typography.title}>New entry</h1>
      <TemplateForm
        template={template}
        entry={entry}
        onUpdate={async (sections, title) => {
          await handleCreate(sections, title);
        }}
        onCancel={() => navigate("/entries")}
        saveLabel="Create"
      />
    </main>
  );
}
