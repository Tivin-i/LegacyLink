import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useVault } from "../context/VaultContext";
import { readStoredBlobFromFile } from "../crypto/vault-crypto";

function isSavePickerSupported(): boolean {
  return typeof window !== "undefined" && typeof window.showSaveFilePicker === "function";
}

export function ExportImportPage() {
  const { exportVault, saveCopyToHandle, importVault } = useVault();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [saveCopyError, setSaveCopyError] = useState<string | null>(null);
  const [saveCopyLoading, setSaveCopyLoading] = useState(false);

  const handleSaveCopyAs = async () => {
    if (!isSavePickerSupported()) {
      handleDownloadBackup();
      return;
    }
    setSaveCopyError(null);
    setSaveCopyLoading(true);
    try {
      const handle = await window.showSaveFilePicker!({
        suggestedName: `legacylink-vault-${new Date().toISOString().slice(0, 10)}.json`,
        types: [{ description: "LegacyLink vault", accept: { "application/json": [".json"] } }],
      });
      const result = await saveCopyToHandle(handle);
      if (!result.ok) {
        setSaveCopyError(result.error ?? "Save failed.");
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setSaveCopyError(err instanceof Error ? err.message : "Could not save file.");
      }
    } finally {
      setSaveCopyLoading(false);
    }
  };

  const handleDownloadBackup = async () => {
    const blob = await exportVault();
    if (!blob) return;
    const json = JSON.stringify(blob, null, 2);
    const blobFile = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blobFile);
    const a = document.createElement("a");
    a.href = url;
    a.download = `legacylink-vault-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    setImportError(null);
    setImportSuccess(false);
    if (!file) return;
    try {
      const stored = await readStoredBlobFromFile(file);
      const result = await importVault(stored);
      if (result.ok) {
        setImportSuccess(true);
      } else {
        setImportError(result.error ?? "Import failed.");
      }
    } catch (err) {
      setImportError(
        err instanceof Error ? err.message : "Import failed. Wrong key or invalid file."
      );
    }
  };

  return (
    <div className="legacy-content">
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        <Link to="/entries" className="legacy-btn" style={{ width: "auto" }}>
          Back to list <span>←</span>
        </Link>
        <Link to="/print" className="legacy-btn" style={{ width: "auto" }}>
          Print vault
        </Link>
      </div>
      <h1 className="type-display">Vault file</h1>
      <div className="content-body" style={{ marginTop: "1rem", marginBottom: "2rem" }}>
        <p>Save a copy of your vault to another file, or replace this vault with the contents of another vault file.</p>
      </div>

      <section aria-labelledby="save-copy-heading" style={{ marginBottom: "2rem" }}>
        <h2 id="save-copy-heading" className="type-label" style={{ marginBottom: "0.5rem" }}>
          Save a copy as…
        </h2>
        <p className="content-body" style={{ marginBottom: "1rem" }}>
          Save an encrypted copy of your vault to a file you choose. You need your decryption key to open it later.
        </p>
        {isSavePickerSupported() ? (
          <>
            <button
              type="button"
              className="legacy-btn"
              style={{ width: "auto" }}
              onClick={handleSaveCopyAs}
              disabled={saveCopyLoading}
              aria-label="Save a copy of the vault to a file"
            >
              {saveCopyLoading ? "Saving…" : "Save a copy as…"} <span>↓</span>
            </button>
            <p style={{ fontSize: "0.875rem", opacity: 0.85, marginTop: "0.5rem" }}>
              Or <button type="button" className="legacy-btn" style={{ padding: "0.25rem 0.5rem", fontSize: "inherit" }} onClick={handleDownloadBackup}>download backup</button> to your default downloads folder.
            </p>
          </>
        ) : (
          <button
            type="button"
            className="legacy-btn"
            style={{ width: "auto" }}
            onClick={handleDownloadBackup}
            aria-label="Download encrypted vault backup"
          >
            Download backup <span>↓</span>
          </button>
        )}
        {saveCopyError && (
          <p role="alert" style={{ marginTop: "0.5rem", fontSize: "0.875rem" }}>
            {saveCopyError}
          </p>
        )}
      </section>

      <section aria-labelledby="import-heading">
        <h2 id="import-heading" className="type-label" style={{ marginBottom: "0.5rem" }}>
          Open another vault
        </h2>
        <p className="content-body" style={{ marginBottom: "1rem" }}>
          Replace this vault with the contents of another vault file. Use the same decryption key you used for that file.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleImport}
          aria-label="Choose vault file to open"
          style={{ position: "absolute", width: "0.1px", height: "0.1px", opacity: 0, overflow: "hidden", zIndex: -1 }}
        />
        <button
          type="button"
          className="legacy-btn"
          style={{ width: "auto" }}
          onClick={() => fileInputRef.current?.click()}
        >
          Choose file… <span>→</span>
        </button>
        {importError && (
          <p role="alert" style={{ marginTop: "0.5rem", fontSize: "0.875rem" }}>
            {importError}
          </p>
        )}
        {importSuccess && (
          <p role="status" style={{ marginTop: "0.5rem", fontSize: "0.9rem", opacity: 0.8 }}>
            Vault replaced successfully.
          </p>
        )}
      </section>
    </div>
  );
}
