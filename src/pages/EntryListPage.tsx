import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useVault } from "../context/VaultContext";
import { getTemplate } from "../templates";
import { layout, links, typography, buttons } from "../styles/shared";

export function EntryListPage() {
  const { vault, lock } = useVault();
  const navigate = useNavigate();
  const entries = vault?.entries ?? [];

  const handleLock = () => {
    lock();
    navigate("/", { replace: true });
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem",
    flexWrap: "wrap",
    gap: "0.75rem",
  };
  const navStyle: React.CSSProperties = {
    display: "flex",
    gap: "0.75rem",
    alignItems: "center",
  };
  const emptyStyle: React.CSSProperties = {
    padding: "2rem",
    textAlign: "center",
    color: "#666",
  };
  const listStyle: React.CSSProperties = {
    listStyle: "none",
    margin: 0,
    padding: 0,
  };
  const entryLinkStyle: React.CSSProperties = {
    display: "block",
    padding: "1rem 0",
    color: "inherit",
    textDecoration: "none",
  };

  return (
    <main style={layout.main}>
      <header style={headerStyle}>
        <h1 style={typography.title}>Entries</h1>
        <nav style={navStyle} aria-label="Actions">
          <Link to="/entries/new" style={links.primary}>
            Add entry
          </Link>
          <Link to="/export-import" style={links.primary}>
            Export / Import
          </Link>
          <button
            type="button"
            onClick={handleLock}
            style={buttons.secondary}
            aria-label="Lock vault"
          >
            Lock
          </button>
        </nav>
      </header>
      {entries.length === 0 ? (
        <section style={emptyStyle} aria-label="Empty state">
          <p>No entries yet.</p>
          <Link to="/entries/new" style={links.primaryWithMargin}>
            Create your first entry
          </Link>
        </section>
      ) : (
        <ul style={listStyle}>
          {entries.map((entry) => {
            const template = getTemplate(entry.templateId);
            return (
              <li key={entry.id} style={{ borderBottom: "1px solid #eee" }}>
                <Link
                  to={`/entries/${entry.id}`}
                  style={entryLinkStyle}
                  aria-label={`Open ${entry.title}`}
                >
                  <span style={{ display: "block", fontWeight: 500 }}>{entry.title}</span>
                  {template && (
                    <span style={{ fontSize: "0.875rem", color: "#666" }}>
                      {template.name}
                    </span>
                  )}
                  <span style={{ fontSize: "0.8125rem", color: "#999" }}>
                    {new Date(entry.updatedAt).toLocaleDateString()}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
