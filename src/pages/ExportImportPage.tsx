import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useVault } from "../context/VaultContext";
import { readStoredBlobFromFile } from "../crypto/vault-crypto";
import { isPasskeySupported } from "../auth/passkey";
import { usePasskeyAvailable } from "../hooks/usePasskeyAvailable";
import { layout, links, typography, buttons, forms, messages } from "../styles/shared";

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
    <main style={layout.main}>
      <Link to="/entries" style={links.back}>
        Back to list
      </Link>
      <h1 style={typography.title}>Export / Import</h1>
      <section style={layout.section} aria-labelledby="passkey-heading">
        <h2 id="passkey-heading" style={typography.h2}>
          Passkey
        </h2>
        <p style={typography.body}>
          Register a passkey to unlock the vault without typing your decryption
          key. Useful for successors with access to your device or authenticator.
        </p>
        {isPasskeySupported() ? (
          <>
            {passkeyRegistered ? (
              <p style={messages.success}>A passkey is registered for this vault.</p>
            ) : (
              <button
                type="button"
                onClick={handleRegisterPasskey}
                disabled={passkeyLoading}
                style={buttons.primary}
                aria-label="Register passkey"
              >
                {passkeyLoading ? "Registering…" : "Register passkey"}
              </button>
            )}
            {passkeyError && (
              <p role="alert" style={messages.error}>
                {passkeyError}
              </p>
            )}
          </>
        ) : (
          <p style={messages.muted}>Passkeys are not supported in this browser.</p>
        )}
      </section>
      <section style={layout.section} aria-labelledby="export-heading">
        <h2 id="export-heading" style={typography.h2}>
          Export vault
        </h2>
        <p style={typography.body}>
          Download an encrypted backup of your vault. Store it safely. You need
          your decryption key to restore it.
        </p>
        <button
          type="button"
          onClick={handleExport}
          style={buttons.primary}
          aria-label="Download encrypted vault backup"
        >
          Download backup
        </button>
      </section>
      <section style={layout.section} aria-labelledby="import-heading">
        <h2 id="import-heading" style={typography.h2}>
          Import vault
        </h2>
        <p style={typography.body}>
          Replace this vault with the contents of a previously exported file.
          Use the same decryption key you used when creating that backup.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleImport}
          aria-label="Choose vault file to import"
          style={forms.fileInputHidden}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={buttons.primary}
        >
          Choose file…
        </button>
        {importError && (
          <p role="alert" style={messages.error}>
            {importError}
          </p>
        )}
        {importSuccess && (
          <p role="status" style={messages.success}>
            Vault imported successfully.
          </p>
        )}
      </section>
    </main>
  );
}
