import { useNavigate, Link } from "react-router-dom";
import { useVault } from "../context/VaultContext";
import { getTemplate, LEGACY_SYSTEM_TEMPLATE_ID } from "../templates";
import { TemplateForm } from "../components/TemplateForm";
import type { SectionData } from "../vault-types";

export function NewEntryPage() {
  const navigate = useNavigate();
  const { createEntry, categories } = useVault();
  const template = getTemplate(LEGACY_SYSTEM_TEMPLATE_ID);

  if (!template) {
    return (
      <div className="legacy-content">
        <p className="content-body">Template not found.</p>
        <Link to="/entries" className="legacy-btn" style={{ width: "auto", display: "inline-block" }}>
          Back to list <span>←</span>
        </Link>
      </div>
    );
  }

  const handleCreate = async (sections: Record<string, SectionData>, title: string, categoryId?: string) => {
    const entry = await createEntry(LEGACY_SYSTEM_TEMPLATE_ID, title, sections, categoryId);
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
    <div className="legacy-content">
      <Link to="/entries" className="legacy-btn" style={{ width: "auto", display: "inline-block", marginBottom: "1.5rem" }}>
        Back to list <span>←</span>
      </Link>
      <h1 className="type-display">New entry</h1>
      <div className="content-body" style={{ marginTop: "1rem", marginBottom: "2rem" }}>
        <p>Create a new system document. All fields are optional; fill in what applies.</p>
      </div>
      <TemplateForm
        template={template}
        entry={entry}
        categories={categories}
        onUpdate={async (sections, title, categoryId) => {
          await handleCreate(sections, title, categoryId);
        }}
        onCancel={() => navigate("/entries")}
        saveLabel="Create"
      />
    </div>
  );
}
