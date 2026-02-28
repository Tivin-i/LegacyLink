import React, { useState, useEffect } from "react";

export interface ConfirmDeleteModalProps {
  open: boolean;
  title: string;
  resourceLabel: string;
  resourceName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDeleteModal({
  open,
  title,
  resourceLabel,
  resourceName,
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps) {
  const [typedName, setTypedName] = useState("");
  const match = typedName.trim() === resourceName.trim();

  useEffect(() => {
    if (!open) setTypedName("");
  }, [open]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!match) return;
    onConfirm();
  };

  return (
    <div
      className="confirm-delete-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-title"
    >
      <div className="confirm-delete-card">
        <h2 id="confirm-delete-title" className="type-display" style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
          {title}
        </h2>
        <p className="content-body" style={{ marginBottom: "1rem" }}>
          To confirm, type the {resourceLabel} name below: <strong>{resourceName}</strong>
        </p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="confirm-delete-input" className="type-label">
            Type &quot;{resourceName}&quot; to confirm
          </label>
          <input
            id="confirm-delete-input"
            type="text"
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            autoFocus
            autoComplete="off"
            className="confirm-delete-input"
            aria-label={`Type ${resourceName} to confirm deletion`}
          />
          <div className="confirm-delete-actions">
            <button type="button" className="legacy-btn" onClick={onCancel} style={{ width: "auto" }}>
              Cancel
            </button>
            <button
              type="submit"
              className="legacy-btn legacy-btn-danger"
              disabled={!match}
              style={{ width: "auto" }}
            >
              Delete
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
