import { useState } from "react";
import { Link } from "react-router-dom";
import { useVault } from "../context/VaultContext";

export function CategoriesPage() {
  const { categories, addCategory, renameCategory, deleteCategory } = useVault();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const name = newName.trim();
    if (!name) return;
    try {
      await addCategory(name);
      setNewName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add category.");
    }
  };

  const startEdit = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
    setError(null);
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setError(null);
    const name = editName.trim();
    if (!name) return;
    try {
      await renameCategory(editingId, name);
      setEditingId(null);
      setEditName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rename.");
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    const result = await deleteCategory(id);
    if (!result.ok) setError(result.error ?? "Failed to delete.");
  };

  return (
    <div className="legacy-content">
      <Link to="/entries" className="legacy-btn" style={{ width: "auto", display: "inline-block", marginBottom: "1.5rem" }}>
        Back to list <span>←</span>
      </Link>
      <h1 className="type-display">Categories</h1>
      <p className="content-body" style={{ marginTop: "1rem", marginBottom: "2rem" }}>
        Group entries by category. Assign categories when creating or editing an entry.
      </p>

      <form onSubmit={handleAdd} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center", marginBottom: "2rem" }}>
        <label htmlFor="new-category-name" className="sr-only">New category name</label>
        <input
          id="new-category-name"
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Category name…"
          style={{ padding: "0.5rem 0.75rem", minWidth: "12rem" }}
          aria-label="New category name"
        />
        <button type="submit" className="legacy-btn" style={{ width: "auto" }} disabled={!newName.trim()}>
          Add category <span>+</span>
        </button>
      </form>

      {error && (
        <p role="alert" style={{ marginBottom: "1rem", fontSize: "0.875rem", opacity: 0.9 }}>
          {error}
        </p>
      )}

      {categories.length === 0 ? (
        <p className="content-body" style={{ opacity: 0.8 }}>No categories yet. Add one above.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {categories.map((cat) => (
            <li key={cat.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
              {editingId === cat.id ? (
                <form onSubmit={handleRename} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                    style={{ padding: "0.35rem 0.5rem", minWidth: "10rem" }}
                    aria-label="Rename category"
                  />
                  <button type="submit" className="legacy-btn" style={{ width: "auto", padding: "0.35rem 0.75rem" }}>
                    Save
                  </button>
                  <button type="button" className="legacy-btn" style={{ width: "auto", padding: "0.35rem 0.75rem" }} onClick={() => { setEditingId(null); setEditName(""); }}>
                    Cancel
                  </button>
                </form>
              ) : (
                <>
                  <span>{cat.name}</span>
                  <button type="button" className="legacy-btn" style={{ width: "auto", padding: "0.25rem 0.5rem", fontSize: "0.875rem" }} onClick={() => startEdit(cat.id, cat.name)} aria-label={`Rename ${cat.name}`}>
                    Rename
                  </button>
                  <button type="button" className="legacy-btn" style={{ width: "auto", padding: "0.25rem 0.5rem", fontSize: "0.875rem" }} onClick={() => window.confirm(`Delete "${cat.name}"?`) && handleDelete(cat.id)} aria-label={`Delete ${cat.name}`}>
                    Delete
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
