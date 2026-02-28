import { Link } from "react-router-dom";
import { useVault } from "../context/VaultContext";

const ACTION_LABELS: Record<string, string> = {
  store_created: "Store created",
  vault_imported: "Vault imported",
  entry_created: "Entry created",
  entry_updated: "Entry updated",
  entry_deleted: "Entry deleted",
};

export function HistoryPage() {
  const { history } = useVault();

  return (
    <div className="legacy-content">
      <Link to="/entries" className="legacy-btn" style={{ width: "auto", display: "inline-block", marginBottom: "1.5rem" }}>
        Back to list <span>←</span>
      </Link>
      <h1 className="type-display">History</h1>
      <p className="content-body" style={{ marginTop: "1rem", marginBottom: "2rem" }}>
        Recent changes to this vault. Read-only.
      </p>

      {history.length === 0 ? (
        <p className="content-body" style={{ opacity: 0.8 }}>No history yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {history.map((entry, i) => {
            const at = new Date(entry.at);
            const dateStr = at.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
            const timeStr = at.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
            const label = ACTION_LABELS[entry.action] ?? entry.action;
            const detail = entry.entryTitle ? ` — ${entry.entryTitle}` : entry.summary ? ` — ${entry.summary}` : "";
            return (
              <li key={`${entry.at}-${i}`} style={{ padding: "0.5rem 0", borderBottom: "1px solid rgba(0,0,0,0.1)" }}>
                <span className="type-mono" style={{ fontSize: "0.8rem", opacity: 0.8 }}>
                  {dateStr} {timeStr}
                </span>
                {" · "}
                <span>{label}{detail}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
