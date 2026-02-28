import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useVault } from "../context/VaultContext";
import { readStoredBlobFromFile } from "../crypto/vault-crypto";
import { isPasskeySupported } from "../auth/passkey";
import { usePasskeyAvailable } from "../hooks/usePasskeyAvailable";

export function ExportImportPage() {
  const {
    exportVault,
    importVault,
    registerPasskey: registerPasskeyFromVault,
  } = useVault();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [passkeyError, setPasskeyError] = useState<string | null>(null);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeyJustRegistered, setPasskeyJustRegistered] = useState(false);
  const passkeyAvailableFromHook = usePasskeyAvailable();
  const passkeyRegistered = passkeyAvailableFromHook || passkeyJustRegistered;

  const handleExport = async () => {
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

  const handleRegisterPasskey = async () => {
    setPasskeyError(null);
    setPasskeyLoading(true);
    const result = await registerPasskeyFromVault();
    setPasskeyLoading(false);
    if (result.ok) {
      setPasskeyJustRegistered(true);
    } else {
      setPasskeyError(result.error ?? "Registration failed.");
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
      <h1 className="type-display">Export / Import</h1>
      <div className="content-body" style={{ marginTop: "1rem", marginBottom: "2rem" }}>
        <p>Backup your vault, import from file, or add a passkey for easier unlock.</p>
      </div>

      <section aria-labelledby="passkey-heading" style={{ marginBottom: "2rem" }}>
        <h2 id="passkey-heading" className="type-label" style={{ marginBottom: "0.5rem" }}>
          Passkey
        </h2>
        <p className="content-body" style={{ marginBottom: "1rem" }}>
          Add a passkey to unlock the vault without typing your decryption
          key. Useful for successors with access to your device or authenticator.
        </p>
        {isPasskeySupported() ? (
          <>
            {passkeyRegistered ? (
              <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>A passkey is added for this vault.</p>
            ) : (
              <button
                type="button"
                className="legacy-btn"
                style={{ width: "auto" }}
                onClick={handleRegisterPasskey}
                disabled={passkeyLoading}
                aria-label="Add a Passkey"
              >
                {passkeyLoading ? "Adding…" : "Add a Passkey"} <span>+</span>
              </button>
            )}
            {passkeyError && (
              <p role="alert" style={{ marginTop: "0.5rem", fontSize: "0.875rem", opacity: 0.9 }}>
                {passkeyError}
              </p>
            )}
          </>
        ) : (
          <p style={{ fontSize: "0.9rem", opacity: 0.6 }}>Passkeys are not supported in this browser.</p>
        )}
      </section>

      <section aria-labelledby="export-heading" style={{ marginBottom: "2rem" }}>
        <h2 id="export-heading" className="type-label" style={{ marginBottom: "0.5rem" }}>
          Export vault
        </h2>
        <p className="content-body" style={{ marginBottom: "1rem" }}>
          Download an encrypted backup of your vault. Store it safely. You need
          your decryption key to restore it.
        </p>
        <button
          type="button"
          className="legacy-btn"
          style={{ width: "auto" }}
          onClick={handleExport}
          aria-label="Download encrypted vault backup"
        >
          Download backup <span>↓</span>
        </button>
      </section>

      <section aria-labelledby="import-heading">
        <h2 id="import-heading" className="type-label" style={{ marginBottom: "0.5rem" }}>
          Import vault
        </h2>
        <p className="content-body" style={{ marginBottom: "1rem" }}>
          Replace this vault with the contents of a previously exported file.
          Use the same decryption key you used when creating that backup.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleImport}
          aria-label="Choose vault file to import"
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
            Vault imported successfully.
          </p>
        )}
      </section>
    </div>
  );
}
