import { Link } from "react-router-dom";
import { useVault } from "../context/VaultContext";
import { getTemplate } from "../templates";
import { MarkdownContent } from "../components/MarkdownContent";
import { DataBlock } from "../components/layout";

/**
 * Print-optimized view of the full vault: For Successors + all entries.
 * User uses browser Print → Save as PDF. Content is sensitive (unencrypted when printed).
 */
export function PrintViewPage() {
  const { vault, successorGuide } = useVault();
  const entries = vault?.entries ?? [];

  return (
    <div className="print-view legacy-content">
      <div className="no-print" style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <Link to="/entries" className="legacy-btn" style={{ width: "auto" }}>
          Back to list <span>←</span>
        </Link>
        <button type="button" className="legacy-btn" style={{ width: "auto" }} onClick={() => window.print()} aria-label="Print or save as PDF">
          Print / Save as PDF
        </button>
      </div>
      <p className="content-body print-warning" style={{ marginBottom: "2rem", padding: "0.75rem", background: "rgba(0,0,0,0.06)", fontSize: "0.9rem" }}>
        This document is unencrypted. Store printed/PDF copies securely.
      </p>

      <section aria-labelledby="successor-guide-heading" style={{ marginBottom: "3rem" }}>
        <h1 id="successor-guide-heading" className="type-display">For Successors</h1>
        {successorGuide?.trim() ? (
          <div className="markdown-content" style={{ marginTop: "1rem" }}>
            <MarkdownContent content={successorGuide} />
          </div>
        ) : (
          <p className="content-body" style={{ marginTop: "1rem", opacity: 0.8 }}>No content.</p>
        )}
      </section>

      <h2 className="type-display" style={{ fontSize: "1.5rem", marginBottom: "1.5rem" }}>Entries</h2>
      {entries.map((entry) => {
        const template = getTemplate(entry.templateId);
        if (!template) return <div key={entry.id}>{entry.title} (template not found)</div>;
        const lastUpdated = new Date(entry.updatedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" }).replace(/\//g, ".");
        return (
          <section key={entry.id} style={{ marginBottom: "2.5rem", breakInside: "avoid" }}>
            <h3 className="type-display" style={{ fontSize: "1.25rem" }}>{entry.title}</h3>
            <p style={{ fontSize: "0.85rem", opacity: 0.8, marginBottom: "1rem" }}>Last updated {lastUpdated} · {template.name}</p>
            {template.sections.map((section) => {
              const rows = section.fields.map((field) => {
                const value = entry.sections[section.id]?.[field.id];
                const hasValue = value !== undefined && value !== null && String(value).trim();
                const display = hasValue
                  ? field.type === "password"
                    ? "••••••••"
                    : field.type === "textarea"
                      ? <MarkdownContent content={String(value)} />
                      : String(value)
                  : "—";
                return { label: field.label, value: display };
              });
              return <DataBlock key={section.id} title={section.label} rows={rows} />;
            })}
          </section>
        );
      })}
    </div>
  );
}
