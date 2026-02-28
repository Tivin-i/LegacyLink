import { useState } from "react";
import { Link } from "react-router-dom";
import { useVault } from "../context/VaultContext";
import { MarkdownContent } from "../components/MarkdownContent";

export function SuccessorGuidePage() {
  const { successorGuide, updateSuccessorGuide } = useVault();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(successorGuide);
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setDraft(successorGuide);
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    await updateSuccessorGuide(draft);
    setSaving(false);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(successorGuide);
    setEditing(false);
  };

  return (
    <div className="legacy-content">
      <Link to="/entries" className="legacy-btn" style={{ width: "auto", display: "inline-block", marginBottom: "1.5rem" }}>
        Back to list <span>←</span>
      </Link>
      <h1 className="type-display">For Successors</h1>
      <p className="content-body" style={{ marginTop: "1rem", marginBottom: "2rem" }}>
        Information for people who will take over this vault. Markdown is supported.
      </p>

      {editing ? (
        <>
          <label htmlFor="successor-guide-edit" className="sr-only">Edit successor guide</label>
          <textarea
            id="successor-guide-edit"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write instructions, contacts, or important notes for successors…"
            rows={12}
            style={{ width: "100%", maxWidth: "65ch", padding: "0.75rem", fontFamily: "inherit", fontSize: "1rem" }}
            aria-label="Successor guide content"
          />
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
            <button type="button" className="legacy-btn" style={{ width: "auto" }} onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
            <button type="button" className="legacy-btn" style={{ width: "auto" }} onClick={handleCancel} disabled={saving}>
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          {successorGuide.trim() ? (
            <div className="markdown-content" style={{ maxWidth: "65ch" }}>
              <MarkdownContent content={successorGuide} />
            </div>
          ) : (
            <p className="content-body" style={{ opacity: 0.8 }}>No content yet. Click Edit to add a guide for successors.</p>
          )}
          <div style={{ marginTop: "1.5rem" }}>
            <button type="button" className="legacy-btn" style={{ width: "auto" }} onClick={startEdit} aria-label="Edit successor guide">
              Edit <span>✎</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
