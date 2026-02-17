import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useVault } from "../context/VaultContext";
import { getTemplate } from "../templates";

export function EntryListPage() {
  const { vault, lock } = useVault();
  const navigate = useNavigate();
  const entries = vault?.entries ?? [];

  const handleLock = () => {
    lock();
    navigate("/", { replace: true });
  };

  return (
    <main style={styles.main}>
      <header style={styles.header}>
        <h1 style={styles.title}>Entries</h1>
        <nav style={styles.nav} aria-label="Actions">
          <Link to="/entries/new" style={styles.link}>
            Add entry
          </Link>
          <Link to="/export-import" style={styles.link}>
            Export / Import
          </Link>
          <button
            type="button"
            onClick={handleLock}
            style={styles.lockButton}
            aria-label="Lock vault"
          >
            Lock
          </button>
        </nav>
      </header>
      {entries.length === 0 ? (
        <section style={styles.empty} aria-label="Empty state">
          <p>No entries yet.</p>
          <Link to="/entries/new" style={styles.primaryLink}>
            Create your first entry
          </Link>
        </section>
      ) : (
        <ul style={styles.list}>
          {entries.map((entry) => {
            const template = getTemplate(entry.templateId);
            return (
              <li key={entry.id} style={styles.item}>
                <Link
                  to={`/entries/${entry.id}`}
                  style={styles.entryLink}
                  aria-label={`Open ${entry.title}`}
                >
                  <span style={styles.entryTitle}>{entry.title}</span>
                  {template && (
                    <span style={styles.entryMeta}>{template.name}</span>
                  )}
                  <span style={styles.entryDate}>
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

const styles: Record<string, React.CSSProperties> = {
  main: {
    maxWidth: "720px",
    margin: "0 auto",
    padding: "1.5rem 1rem",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem",
    flexWrap: "wrap",
    gap: "0.75rem",
  },
  title: {
    margin: 0,
    fontSize: "1.5rem",
    fontWeight: 600,
  },
  nav: {
    display: "flex",
    gap: "0.75rem",
    alignItems: "center",
  },
  link: {
    color: "#2563eb",
    textDecoration: "none",
    fontWeight: 500,
  },
  primaryLink: {
    color: "#2563eb",
    textDecoration: "none",
    fontWeight: 500,
    marginTop: "0.5rem",
    display: "inline-block",
  },
  lockButton: {
    padding: "0.5rem 0.75rem",
    background: "transparent",
    border: "1px solid #ccc",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.9375rem",
  },
  empty: {
    padding: "2rem",
    textAlign: "center",
    color: "#666",
  },
  list: {
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  item: {
    borderBottom: "1px solid #eee",
  },
  entryLink: {
    display: "block",
    padding: "1rem 0",
    color: "inherit",
    textDecoration: "none",
  },
  entryTitle: {
    display: "block",
    fontWeight: 500,
  },
  entryMeta: {
    fontSize: "0.875rem",
    color: "#666",
  },
  entryDate: {
    fontSize: "0.8125rem",
    color: "#999",
  },
};
