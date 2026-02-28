import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useVault } from "../context/VaultContext";
import { getTemplate } from "../templates";

type CategoryFilter = "all" | "none" | string;

export function EntryListPage() {
  const { vault } = useVault();
  const entries = vault?.entries ?? [];
  const categories = vault?.categories ?? [];
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");

  const filteredEntries = useMemo(() => {
    if (categoryFilter === "all") return entries;
    if (categoryFilter === "none") return entries.filter((e) => !e.categoryId || e.categoryId === "");
    return entries.filter((e) => e.categoryId === categoryFilter);
  }, [entries, categoryFilter]);

  const categoryById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of categories) map[c.id] = c.name;
    return map;
  }, [categories]);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="type-display">
            Overview <sup>(START)</sup>
          </h1>
          <div className="content-body" style={{ marginTop: "1rem" }}>
            <p>Select a system from the index to view its documentation, or add a new entry.</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <Link to="/print" className="legacy-btn" style={{ width: "auto", padding: "1rem 1.5rem" }}>
            Print vault
          </Link>
          <Link to="/entries/new" className="legacy-btn" style={{ width: "auto", padding: "1rem 1.5rem" }}>
            Add entry <span>+</span>
          </Link>
        </div>
      </div>

      {categories.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <label htmlFor="filter-category" className="sr-only">Filter by category</label>
          <select
            id="filter-category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
            style={{ padding: "0.5rem 0.75rem", minWidth: "10rem" }}
            aria-label="Filter by category"
          >
            <option value="all">All</option>
            <option value="none">Uncategorized</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      {filteredEntries.length === 0 ? (
        <div className="content-body">
          <p style={{ color: "var(--ink)", opacity: 0.7 }}>
            {entries.length === 0 ? "No entries yet. Add your first system to get started." : "No entries in this category."}
          </p>
        </div>
      ) : (
        <ul className="nav-list" style={{ marginTop: 0 }}>
          {filteredEntries.map((entry) => {
            const template = getTemplate(entry.templateId);
            const categoryName = entry.categoryId ? categoryById[entry.categoryId] : null;
            return (
              <li key={entry.id} style={{ listStyle: "none" }}>
                <Link
                  to={`/entries/${entry.id}`}
                  className="nav-item"
                  style={{ textDecoration: "none", color: "inherit" }}
                  aria-label={`Open ${entry.title}`}
                >
                  {entry.title}
                  {template != null && <small className="nav-item-sub">{template.name}</small>}
                  {categoryName != null && <small className="nav-item-sub" style={{ marginLeft: "0.25rem" }}> · {categoryName}</small>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
