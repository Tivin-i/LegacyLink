import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useVault } from "../context/VaultContext";
import { useLayoutContext } from "../context/LayoutContext";
import { getTemplate } from "../templates";
import { TemplateForm } from "../components/TemplateForm";
import { DocMeta, DataBlock, ConfirmDeleteModal } from "../components/layout";
import { MarkdownContent } from "../components/MarkdownContent";
import type { SectionData } from "../vault-types";

export function EntryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getEntry, updateEntry, deleteEntry, categories, userAka } = useVault();
  const { setContextPanelActions } = useLayoutContext() ?? {};
  const entry = id ? getEntry(id) : undefined;
  const [editing, setEditing] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (setContextPanelActions == null) return;
    if (entry == null) {
      setContextPanelActions(null);
      return;
    }
    setContextPanelActions({
      onEdit: () => setEditing(true),
      onPrint: () => window.print(),
    });
    return () => setContextPanelActions(null);
  }, [entry?.id, setContextPanelActions]);

  if (!entry) {
    return (
      <div className="legacy-content">
        <p className="content-body">Entry not found.</p>
        <Link to="/entries" className="legacy-btn" style={{ width: "auto", display: "inline-block" }}>
          Back to list <span>←</span>
        </Link>
      </div>
    );
  }

  const template = getTemplate(entry.templateId);
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

  const handleUpdate = async (sections: Record<string, SectionData>, title: string, categoryId?: string) => {
    await updateEntry(entry.id, (e) => ({
      ...e,
      title,
      sections,
      ...(categoryId != null && categoryId !== "" ? { categoryId } : { categoryId: undefined }),
      updatedAt: new Date().toISOString(),
    }));
    setEditing(false);
  };

  const handleDelete = () => setDeleteModalOpen(true);

  const confirmDeleteEntry = async () => {
    await deleteEntry(entry.id);
    setDeleteModalOpen(false);
    navigate("/entries", { replace: true });
  };

  if (editing) {
    return (
      <div className="legacy-content">
        <Link to="/entries" className="legacy-btn" style={{ width: "auto", display: "inline-block", marginBottom: "1.5rem" }}>
          Back to list <span>←</span>
        </Link>
        <TemplateForm
          template={template}
          entry={entry}
          categories={categories}
          onUpdate={(sections, title, categoryId) => handleUpdate(sections, title, categoryId)}
          onCancel={() => setEditing(false)}
          saveLabel="Save"
        />
        <div style={{ marginTop: "1.5rem" }}>
          <button
            type="button"
            className="legacy-btn"
            style={{ width: "auto", borderColor: "var(--ink)", opacity: 0.8 }}
            onClick={handleDelete}
            aria-label="Delete entry"
          >
            Delete
          </button>
        </div>
        <ConfirmDeleteModal
          open={deleteModalOpen}
          title="Delete system?"
          resourceLabel="system"
          resourceName={entry.title}
          onConfirm={confirmDeleteEntry}
          onCancel={() => setDeleteModalOpen(false)}
        />
      </div>
    );
  }

  const lastUpdated = new Date(entry.updatedAt);
  const formattedDate = lastUpdated.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" }).replace(/\//g, ".");

  return (
    <div className="legacy-content">
      <DocMeta
        items={[
          { label: "Last Updated", value: formattedDate },
          { label: "Author", value: userAka ? <>Admin <sup className="sup-tag">aka {userAka}</sup></> : "Admin" },
          { label: "Status", value: <>Live <sup className="sup-tag">(US-EAST)</sup></> },
        ]}
      />

      <h1 className="type-display">
        {entry.title}
      </h1>

      <div className="content-body">
        <p>
          This document outlines the system and access details. Use the index to navigate between systems.
        </p>
      </div>

      {template.sections.map((section) => {
        const rows = section.fields.map((field) => {
          const value = entry.sections[section.id]?.[field.id];
          const hasValue = value !== undefined && value !== null && String(value).trim();
          const display =
            hasValue
              ? field.type === "password"
                ? "••••••••"
                : field.type === "textarea"
                  ? <MarkdownContent content={String(value)} />
                  : String(value)
              : "—";
          return { label: field.label, value: display };
        });
        return (
          <DataBlock
            key={section.id}
            title={section.label}
            badge="[READ ONLY]"
            rows={rows}
          />
        );
      })}

      <div className="content-body" style={{ marginTop: "3rem" }}>
        <h3 style={{ fontSize: "1.5rem", marginBottom: "1rem", fontWeight: 400 }}>
          Actions
        </h3>
        <p>
          Use the Quick Actions panel to edit this document, view history, or print / export to PDF.
        </p>
      </div>
    </div>
  );
}
