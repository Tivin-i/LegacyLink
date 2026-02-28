import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useVault } from "../context/VaultContext";

function formatSnapshotLabel(vault: { history?: { at?: string }[]; entries?: { updatedAt?: string }[] }, index: number): string {
  const fromHistory = vault.history?.[0]?.at;
  const fromEntries = vault.entries?.length
    ? vault.entries.reduce((max, e) => (e.updatedAt && (!max || e.updatedAt > max) ? e.updatedAt : max), "")
    : "";
  const iso = fromHistory || fromEntries || "";
  if (iso) {
    try {
      const d = new Date(iso);
      if (!Number.isNaN(d.getTime())) return d.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
    } catch {
      // ignore
    }
  }
  return `Snapshot ${index + 1}`;
}

export function SettingsPage() {
  const {
    userAka,
    updateUserAka,
    versionHistoryLimit,
    updateVersionHistoryLimit,
    versionSnapshots,
    restoreVersion,
    estimatedVaultSizeBytes,
  } = useVault();
  const [aka, setAka] = useState(userAka);
  const [versionLimit, setVersionLimit] = useState(String(versionHistoryLimit));
  useEffect(() => {
    setAka(userAka);
  }, [userAka]);
  useEffect(() => {
    setVersionLimit(String(versionHistoryLimit));
  }, [versionHistoryLimit]);
  const [saved, setSaved] = useState(false);
  const [versionSaved, setVersionSaved] = useState(false);
  const [restoring, setRestoring] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserAka(aka);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleVersionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseInt(versionLimit, 10);
    if (!Number.isNaN(n) && n >= 0 && n <= 100) {
      await updateVersionHistoryLimit(n);
      setVersionSaved(true);
      setTimeout(() => setVersionSaved(false), 2000);
    }
  };

  const handleRestoreVersion = async (index: number) => {
    setRestoring(index);
    try {
      await restoreVersion(index);
    } finally {
      setRestoring(null);
    }
  };

  return (
    <div className="legacy-content">
      <Link to="/entries" className="legacy-btn" style={{ width: "auto", display: "inline-block", marginBottom: "1.5rem" }}>
        Back to list <span>←</span>
      </Link>
      <h1 className="type-display">Settings</h1>
      <p className="content-body" style={{ marginTop: "1rem", marginBottom: "2rem" }}>
        Set your AKA (nickname). It appears as the document author on system entries.
      </p>

      <form onSubmit={handleSubmit} style={{ maxWidth: "24rem" }}>
        <label htmlFor="settings-aka">AKA (nickname)</label>
        <input
          id="settings-aka"
          type="text"
          value={aka}
          onChange={(e) => setAka(e.target.value)}
          placeholder="e.g. DAD"
          aria-label="AKA nickname"
          style={{ marginTop: "0.25rem", marginBottom: "1rem" }}
        />
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button type="submit" className="legacy-btn legacy-btn-primary" style={{ width: "auto" }}>
            Save
          </button>
          {saved && (
            <span style={{ fontSize: "0.875rem", opacity: 0.8 }}>Saved.</span>
          )}
        </div>
      </form>

      <h2 className="type-display" style={{ fontSize: "1.25rem", marginTop: "2.5rem", marginBottom: "0.5rem" }}>
        Vault file
      </h2>
      <p className="content-body" style={{ marginTop: "0.25rem", marginBottom: "1rem" }}>
        Versions to keep: how many past snapshots are stored in the vault file. This directly affects the vault file size.
      </p>
      <form onSubmit={handleVersionSubmit} style={{ maxWidth: "24rem" }}>
        <label htmlFor="settings-version-limit">Versions to keep</label>
        <input
          id="settings-version-limit"
          type="number"
          min={0}
          max={100}
          value={versionLimit}
          onChange={(e) => setVersionLimit(e.target.value)}
          aria-label="Versions to keep"
          style={{ marginTop: "0.25rem", marginBottom: "0.5rem" }}
        />
        <p style={{ fontSize: "0.875rem", opacity: 0.85, marginBottom: "1rem" }}>
          Keeping more versions increases the vault file size. Set to 0 to disable version history.
        </p>
        {estimatedVaultSizeBytes != null && (
          <p style={{ fontSize: "0.875rem", opacity: 0.85, marginBottom: "1rem" }}>
            Approximate vault file size: ~{(estimatedVaultSizeBytes / 1024).toFixed(1)} KB
            {versionHistoryLimit > 0 && " (with current version limit)."}
          </p>
        )}
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button type="submit" className="legacy-btn legacy-btn-primary" style={{ width: "auto" }}>
            Save
          </button>
          {versionSaved && (
            <span style={{ fontSize: "0.875rem", opacity: 0.8 }}>Saved.</span>
          )}
        </div>
      </form>

      {versionSnapshots.length > 0 && (
        <>
          <h2 className="type-display" style={{ fontSize: "1.25rem", marginTop: "2.5rem", marginBottom: "0.5rem" }}>
            History of versions
          </h2>
          <p className="content-body" style={{ marginTop: "0.25rem", marginBottom: "1rem" }}>
            Past snapshots stored in the vault file. Restoring replaces the current vault with that snapshot and saves.
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {versionSnapshots.map((v, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  marginBottom: "0.5rem",
                  padding: "0.5rem 0",
                  borderBottom: "1px solid rgba(0,0,0,0.08)",
                }}
              >
                <span style={{ flex: 1, fontSize: "0.9rem" }}>{formatSnapshotLabel(v, i)}</span>
                <button
                  type="button"
                  className="legacy-btn"
                  style={{ width: "auto", padding: "0.25rem 0.5rem" }}
                  onClick={() => void handleRestoreVersion(i)}
                  disabled={restoring !== null}
                  aria-label={`Restore version from ${formatSnapshotLabel(v, i)}`}
                >
                  {restoring === i ? "Restoring…" : "Restore"}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
