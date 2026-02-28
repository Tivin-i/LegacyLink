import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useVault } from "../context/VaultContext";
import { authenticateWithPasskey } from "../auth/passkey";
import { readStoredBlobFromFile } from "../crypto/vault-crypto";
import type { StoredEncryptedBlob } from "../crypto/vault-crypto";
import { usePasskeyAvailable } from "../hooks/usePasskeyAvailable";
import { TextureOverlay } from "../components/layout";

type Step =
  | "choice"
  | "create-key"
  | "open-file"
  | "open-key"
  | "unlock";

const formColumnStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.75rem",
  marginTop: "1rem",
};
const formActionsRowStyle: React.CSSProperties = {
  display: "flex",
  gap: "0.5rem",
  flexWrap: "wrap",
};
const errorStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "0.875rem",
  opacity: 0.9,
};
const mutedStyle: React.CSSProperties = {
  margin: "1.5rem 0 0",
  fontSize: "0.8125rem",
  opacity: 0.7,
};

export function UnlockPage() {
  const [step, setStep] = useState<Step>("unlock");
  const [passphrase, setPassphrase] = useState("");
  const [confirmPassphrase, setConfirmPassphrase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [importFile, setImportFile] = useState<StoredEncryptedBlob | null>(null);
  const passkeyAvailable = usePasskeyAvailable();
  const {
    hasExistingStore,
    unlock,
    createNewStore,
    importExistingStore,
  } = useVault();
  const navigate = useNavigate();

  useEffect(() => {
    if (hasExistingStore === false) {
      setStep("choice");
    } else if (hasExistingStore === true) {
      setStep("unlock");
    }
  }, [hasExistingStore]);

  const doUnlock = async (key: string) => {
    setError(null);
    setLoading(true);
    const result = await unlock(key);
    setLoading(false);
    if (result.ok) {
      navigate("/entries", { replace: true });
    } else {
      setError(result.error ?? "Unlock failed. Wrong key or corrupted data.");
    }
  };

  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase.trim()) {
      setError("Enter your decryption key.");
      return;
    }
    await doUnlock(passphrase.trim());
  };

  const handlePasskey = async () => {
    const result = await authenticateWithPasskey();
    if (result.ok) {
      await doUnlock(result.passphrase);
    } else {
      setError(result.error ?? "Passkey sign-in failed.");
    }
  };

  const handleCreateStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!passphrase.trim()) {
      setError("Enter a decryption key.");
      return;
    }
    if (passphrase !== confirmPassphrase) {
      setError("Decryption key and confirmation do not match.");
      return;
    }
    setLoading(true);
    const result = await createNewStore(passphrase.trim());
    setLoading(false);
    if (result.ok) {
      navigate("/entries", { replace: true });
    } else {
      setError(result.error ?? "Failed to create store.");
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const stored = await readStoredBlobFromFile(file);
      setImportFile(stored);
      setStep("open-key");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid file.");
    }
    e.target.value = "";
  };

  const handleOpenStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;
    if (!passphrase.trim()) {
      setError("Enter the decryption key for this store.");
      return;
    }
    setError(null);
    setLoading(true);
    const result = await importExistingStore(importFile, passphrase.trim());
    setLoading(false);
    if (result.ok) {
      navigate("/entries", { replace: true });
    } else {
      setError(result.error ?? "Wrong key or invalid file.");
    }
  };

  const goBack = () => {
    setStep("choice");
    setPassphrase("");
    setConfirmPassphrase("");
    setImportFile(null);
    setError(null);
  };

  if (hasExistingStore === null) {
    return (
      <>
        <TextureOverlay />
        <main className="legacy-standalone">
          <div className="legacy-card">
            <p style={mutedStyle}>Loading…</p>
          </div>
        </main>
      </>
    );
  }

  if (hasExistingStore === false && step === "choice") {
    return (
      <>
        <TextureOverlay />
        <main className="legacy-standalone">
          <div className="legacy-card">
            <h1 className="type-display">LegacyLink</h1>
            <p className="content-body" style={{ marginTop: "0.5rem" }}>
              No store on this device. Create a new one or open an existing store from a file.
            </p>
            <div style={formColumnStyle}>
              <button
                type="button"
                className="legacy-btn"
                style={{ width: "100%" }}
                onClick={() => {
                  setStep("create-key");
                  setError(null);
                  setPassphrase("");
                  setConfirmPassphrase("");
                }}
              >
                Create a new LegacyLink Store <span>+</span>
              </button>
              <button
                type="button"
                className="legacy-btn"
                style={{ width: "100%" }}
                onClick={() => {
                  setStep("open-file");
                  setError(null);
                  setImportFile(null);
                }}
              >
                Open existing LegacyLink Store (import from file) <span>→</span>
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (hasExistingStore === false && step === "create-key") {
    return (
      <>
        <TextureOverlay />
        <main className="legacy-standalone">
          <div className="legacy-card">
            <h1 className="type-display">Create a new decryption key for this store</h1>
            <p className="content-body" style={{ marginTop: "0.5rem" }}>
              Choose a decryption key. You will need it every time you open this store. Keep a backup in a safe place.
            </p>
            <form onSubmit={handleCreateStoreSubmit} style={formColumnStyle}>
              <label htmlFor="passphrase">Decryption key</label>
              <input
                id="passphrase"
                name="passphrase"
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
                placeholder="Decryption key…"
                aria-describedby={error ? "create-error" : undefined}
                aria-invalid={!!error}
              />
              <label htmlFor="confirm-passphrase">Confirm decryption key</label>
              <input
                id="confirm-passphrase"
                name="confirmPassphrase"
                type="password"
                value={confirmPassphrase}
                onChange={(e) => setConfirmPassphrase(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
                placeholder="Confirm decryption key…"
              />
              {error && (
                <p id="create-error" role="alert" style={errorStyle}>
                  {error}
                </p>
              )}
              <div style={formActionsRowStyle}>
                <button type="button" className="legacy-btn" style={{ width: "auto" }} onClick={goBack} disabled={loading}>
                  Back
                </button>
                <button
                  type="submit"
                  className="legacy-btn"
                  style={{ width: "auto" }}
                  disabled={loading || !passphrase.trim() || !confirmPassphrase.trim()}
                >
                  {loading ? "Creating…" : "Create store"}
                </button>
              </div>
            </form>
          </div>
        </main>
      </>
    );
  }

  if (hasExistingStore === false && step === "open-file") {
    return (
      <>
        <TextureOverlay />
        <main className="legacy-standalone">
          <div className="legacy-card">
            <h1 className="type-display">Open existing Store</h1>
            <p className="content-body" style={{ marginTop: "0.5rem" }}>
              Select an exported LegacyLink store file, then enter its decryption key.
            </p>
            <div style={formColumnStyle}>
              <label htmlFor="store-file">Store file</label>
              <input
                id="store-file"
                type="file"
                accept=".json,application/json"
                onChange={handleFileSelect}
                style={{ padding: "0.5rem" }}
              />
              {error && (
                <p role="alert" style={errorStyle}>
                  {error}
                </p>
              )}
              <button type="button" className="legacy-btn" style={{ width: "auto" }} onClick={goBack}>
                Back
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (hasExistingStore === false && step === "open-key" && importFile) {
    return (
      <>
        <TextureOverlay />
        <main className="legacy-standalone">
          <div className="legacy-card">
            <h1 className="type-display">Decryption key</h1>
            <p className="content-body" style={{ marginTop: "0.5rem" }}>
              Enter the decryption key for the store you selected. It will be checked before importing.
            </p>
            <form onSubmit={handleOpenStoreSubmit} style={formColumnStyle}>
              <label htmlFor="import-passphrase" className="sr-only">
                Decryption key
              </label>
              <input
                id="import-passphrase"
                name="passphrase"
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
                placeholder="Decryption key…"
                aria-describedby={error ? "import-error" : undefined}
                aria-invalid={!!error}
              />
              {error && (
                <p id="import-error" role="alert" style={errorStyle}>
                  {error}
                </p>
              )}
              <div style={formActionsRowStyle}>
                <button type="button" className="legacy-btn" style={{ width: "auto" }} onClick={goBack} disabled={loading}>
                  Back
                </button>
                <button
                  type="submit"
                  className="legacy-btn"
                  style={{ width: "auto" }}
                  disabled={loading || !passphrase.trim()}
                >
                  {loading ? "Verifying key…" : "Open store"}
                </button>
              </div>
            </form>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <TextureOverlay />
      <main className="legacy-standalone">
        <div className="legacy-card">
          <h1 className="type-display">LegacyLink</h1>
          <p className="content-body" style={{ marginTop: "0.5rem" }}>
            Enter your decryption key to open your vault.
          </p>
          <form onSubmit={handleUnlockSubmit} style={formColumnStyle}>
            <label htmlFor="passphrase" className="sr-only">
              Decryption key
            </label>
            <input
              id="passphrase"
              name="passphrase"
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
              autoFocus
              placeholder="Decryption key…"
              aria-describedby={error ? "passphrase-error" : undefined}
              aria-invalid={!!error}
            />
            {error && (
              <p id="passphrase-error" role="alert" style={errorStyle}>
                {error}
              </p>
            )}
            <button
              type="submit"
              className="legacy-btn"
              style={{ width: "100%" }}
              disabled={loading || !passphrase.trim()}
              aria-label="Unlock vault"
            >
              {loading ? "Unlocking…" : "Unlock"}
            </button>
          </form>
          {passkeyAvailable && (
            <div style={{ marginTop: "0.75rem" }}>
              <button
                type="button"
                className="legacy-btn"
                style={{ width: "100%" }}
                onClick={handlePasskey}
                disabled={loading}
                aria-label="Unlock with passkey"
              >
                Unlock with passkey <span>→</span>
              </button>
            </div>
          )}
          <p style={mutedStyle}>
            Your key is never stored. Keep a backup in a safe place for successors.
          </p>
          <p style={{ ...mutedStyle, marginTop: "0.5rem" }}>
            After unlocking, open Export / Import to add a passkey for easier unlock.
          </p>
        </div>
      </main>
    </>
  );
}
