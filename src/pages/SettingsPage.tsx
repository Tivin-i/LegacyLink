import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useVault } from "../context/VaultContext";

export function SettingsPage() {
  const { userAka, updateUserAka } = useVault();
  const [aka, setAka] = useState(userAka);
  useEffect(() => {
    setAka(userAka);
  }, [userAka]);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserAka(aka);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
    </div>
  );
}
