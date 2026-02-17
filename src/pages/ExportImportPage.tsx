import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useVault } from "../context/VaultContext";
import {
  exportVaultEncrypted,
  importVaultFromBlob,
} from "../vault/vault-service";
import type { StoredEncryptedBlob } from "../crypto/vault-crypto";
import {
  isPasskeySupported,
  isPasskeyConfigured,
  registerPasskey,
} from "../auth/passkey";

export function ExportImportPage() {
  const { vault, passphraseRef, updateVault } = useVault();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [passkeyRegistered, setPasskeyRegistered] = useState(false);
  const [passkeyError, setPasskeyError] = useState<string | null>(null);
  const [passkeyLoading, setPasskeyLoading] = useState(false);

  const handleExport = async () => {
    if (!vault || !passphraseRef) return;
    const blob = await exportVaultEncrypted(passphraseRef.current, vault);
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
    if (!file || !passphraseRef) return;
    try {
      const text = await file.text();
      const stored = JSON.parse(text) as StoredEncryptedBlob;
      if (
        typeof stored.version !== "number" ||
        typeof stored.salt !== "string" ||
        typeof stored.iv !== "string" ||
        typeof stored.ciphertext !== "string"
      ) {
        throw new Error("Invalid vault file format.");
      }
      const data = await importVaultFromBlob(passphraseRef.current, stored);
      await updateVault(() => data);
      setImportSuccess(true);
    } catch (err) {
      setImportError(
        err instanceof Error ? err.message : "Import failed. Wrong key or invalid file."
      );
    }
  };

  const handleRegisterPasskey = async () => {
    if (!passphraseRef?.current) return;
    setPasskeyError(null);
    setPasskeyLoading(true);
    const result = await registerPasskey(passphraseRef.current);
    setPasskeyLoading(false);
    if (result.ok) {
      setPasskeyRegistered(true);
    } else {
      setPasskeyError(result.error ?? "Registration failed.");
    }
  };

  React.useEffect(() => {
    if (isPasskeySupported()) {
      isPasskeyConfigured().then(setPasskeyRegistered);
    }
  }, []);

  return (
    <main style={styles.main}>
      <Link to="/entries" style={styles.back}>
        Back to list
      </Link>
      <h1 style={styles.title}>Export / Import</h1>
      <section style={styles.section} aria-labelledby="passkey-heading">
        <h2 id="passkey-heading" style={styles.h2}>
          Passkey
        </h2>
        <p style={styles.p}>
          Register a passkey to unlock the vault without typing your decryption
          key. Useful for successors with access to your device or authenticator.
        </p>
        {isPasskeySupported() ? (
          <>
            {passkeyRegistered ? (
              <p style={styles.success}>A passkey is registered for this vault.</p>
            ) : (
              <button
                type="button"
                onClick={handleRegisterPasskey}
                disabled={passkeyLoading}
                style={styles.button}
                aria-label="Register passkey"
              >
                {passkeyLoading ? "Registering…" : "Register passkey"}
              </button>
            )}
            {passkeyError && (
              <p role="alert" style={styles.error}>
                {passkeyError}
              </p>
            )}
          </>
        ) : (
          <p style={styles.muted}>Passkeys are not supported in this browser.</p>
        )}
      </section>
      <section style={styles.section} aria-labelledby="export-heading">
        <h2 id="export-heading" style={styles.h2}>
          Export vault
        </h2>
        <p style={styles.p}>
          Download an encrypted backup of your vault. Store it safely. You need
          your decryption key to restore it.
        </p>
        <button
          type="button"
          onClick={handleExport}
          style={styles.button}
          aria-label="Download encrypted vault backup"
        >
          Download backup
        </button>
      </section>
      <section style={styles.section} aria-labelledby="import-heading">
        <h2 id="import-heading" style={styles.h2}>
          Import vault
        </h2>
        <p style={styles.p}>
          Replace this vault with the contents of a previously exported file.
          Use the same decryption key you used when creating that backup.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleImport}
          aria-label="Choose vault file to import"
          style={styles.fileInput}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={styles.button}
        >
          Choose file…
        </button>
        {importError && (
          <p role="alert" style={styles.error}>
            {importError}
          </p>
        )}
        {importSuccess && (
          <p role="status" style={styles.success}>
            Vault imported successfully.
          </p>
        )}
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    maxWidth: "720px",
    margin: "0 auto",
    padding: "1.5rem 1rem",
  },
  back: {
    color: "#2563eb",
    textDecoration: "none",
    display: "inline-block",
    marginBottom: "1rem",
  },
  title: {
    margin: "0 0 1rem",
    fontSize: "1.5rem",
  },
  section: {
    marginBottom: "2rem",
  },
  h2: {
    margin: "0 0 0.5rem",
    fontSize: "1.125rem",
    fontWeight: 600,
  },
  p: {
    margin: "0 0 0.75rem",
    color: "#555",
    fontSize: "0.9375rem",
  },
  button: {
    padding: "0.5rem 1rem",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: 500,
  },
  fileInput: {
    position: "absolute",
    width: "0.1px",
    height: "0.1px",
    opacity: 0,
    overflow: "hidden",
    zIndex: -1,
  },
  error: {
    margin: "0.75rem 0 0",
    color: "#b91c1c",
    fontSize: "0.9375rem",
  },
  success: {
    margin: "0.75rem 0 0",
    color: "#15803d",
    fontSize: "0.9375rem",
  },
  muted: {
    margin: 0,
    color: "#666",
    fontSize: "0.9375rem",
  },
};
