import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVault } from "../context/VaultContext";
import { TextureOverlay } from "../components/layout";

type Step =
  | "choice"
  | "create-key"
  | "open-file"
  | "open-key";

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

function isSavePickerSupported(): boolean {
  return typeof window !== "undefined" && typeof window.showSaveFilePicker === "function";
}

function isOpenPickerSupported(): boolean {
  return typeof window !== "undefined" && typeof window.showOpenFilePicker === "function";
}

export function UnlockPage() {
  const [step, setStep] = useState<Step>("choice");
  const [passphrase, setPassphrase] = useState("");
  const [confirmPassphrase, setConfirmPassphrase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importHandle, setImportHandle] = useState<FileSystemFileHandle | null>(null);
  const [createHandle, setCreateHandle] = useState<FileSystemFileHandle | null>(null);
  const { createNewStoreWithHandle, importExistingStore } = useVault();
  const navigate = useNavigate();

  const handleCreateNewClick = async () => {
    setError(null);
    setPassphrase("");
    setConfirmPassphrase("");
    setCreateHandle(null);
    if (isSavePickerSupported()) {
      try {
        const handle = await window.showSaveFilePicker!({
          suggestedName: "legacylink-vault.json",
          types: [{ description: "LegacyLink vault", accept: { "application/json": [".json"] } }],
        });
        setCreateHandle(handle);
        setStep("create-key");
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError(err instanceof Error ? err.message : "Could not open save dialog.");
        }
      }
    } else {
      setStep("create-key");
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
    if (isSavePickerSupported() && !createHandle) {
      setError("Please choose where to save the vault file first.");
      return;
    }
    setLoading(true);
    try {
      if (createHandle) {
        const result = await createNewStoreWithHandle(createHandle, passphrase.trim());
        setLoading(false);
        if (result.ok) {
          setPassphrase("");
          setConfirmPassphrase("");
          navigate("/entries", { replace: true });
        } else {
          setError(result.error ?? "Failed to create store.");
        }
      } else {
        setError("Save file picker is not supported in this browser. Use a modern browser (e.g. Chrome, Edge).");
        setLoading(false);
      }
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Failed to create store.");
    }
  };

  const handleOpenFilePicker = async () => {
    setError(null);
    if (isOpenPickerSupported()) {
      try {
        const handles = await window.showOpenFilePicker!({
          types: [{ description: "LegacyLink vault", accept: { "application/json": [".json"] } }],
          multiple: false,
        });
        const handle = handles[0];
        if (handle) {
          const file = await handle.getFile();
          setImportFile(file);
          setImportHandle(handle);
          setStep("open-key");
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError(err instanceof Error ? err.message : "Could not open file.");
        }
      }
    } else {
      setStep("open-file");
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setImportFile(file);
    setImportHandle(null);
    setStep("open-key");
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
    const result = await importExistingStore(importFile, passphrase.trim(), importHandle);
    setLoading(false);
    if (result.ok) {
      setPassphrase("");
      setConfirmPassphrase("");
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
    setImportHandle(null);
    setCreateHandle(null);
    setError(null);
  };

  if (step === "choice") {
    return (
      <>
        <TextureOverlay />
        <main className="legacy-standalone">
          <div className="legacy-card">
            <h1 className="type-display">LegacyLink</h1>
            <p className="content-body" style={{ marginTop: "0.5rem" }}>
              Import a vault file or create a new one. You choose where the vault file is saved.
            </p>
            <div style={formColumnStyle}>
              <button
                type="button"
                className="legacy-btn"
                style={{ width: "100%" }}
                onClick={() => void handleOpenFilePicker()}
              >
                Import vault <span>→</span>
              </button>
              <button
                type="button"
                className="legacy-btn"
                style={{ width: "100%" }}
                onClick={handleCreateNewClick}
              >
                Create a new one <span>+</span>
              </button>
            </div>
            {error && (
              <p role="alert" style={{ ...errorStyle, marginTop: "1rem" }}>
                {error}
              </p>
            )}
          </div>
        </main>
      </>
    );
  }

  if (step === "create-key") {
    return (
      <>
        <TextureOverlay />
        <main className="legacy-standalone">
          <div className="legacy-card">
            <h1 className="type-display">Create a new vault</h1>
            <p className="content-body" style={{ marginTop: "0.5rem" }}>
              Choose a decryption key. You will need it every time you open this vault. Keep a backup in a safe place.
            </p>
            {createHandle && (
              <p className="content-body" style={{ fontSize: "0.875rem", opacity: 0.85, marginTop: "0.25rem" }}>
                Saving to the file you selected.
              </p>
            )}
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
                  className="legacy-btn legacy-btn-primary"
                  style={{ width: "auto" }}
                  disabled={loading || !passphrase.trim() || !confirmPassphrase.trim()}
                >
                  {loading ? "Creating…" : "Create vault"}
                </button>
              </div>
            </form>
          </div>
        </main>
      </>
    );
  }

  if (step === "open-file") {
    return (
      <>
        <TextureOverlay />
        <main className="legacy-standalone">
          <div className="legacy-card">
            <h1 className="type-display">Import vault</h1>
            <p className="content-body" style={{ marginTop: "0.5rem" }}>
              Select a LegacyLink vault file (.json), then enter its decryption key.
            </p>
            <div style={formColumnStyle}>
              <label htmlFor="store-file">Vault file</label>
              <input
                id="store-file"
                type="file"
                accept=".json,application/json"
                onChange={handleFileInputChange}
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

  if (step === "open-key" && importFile) {
    return (
      <>
        <TextureOverlay />
        <main className="legacy-standalone">
          <div className="legacy-card">
            <h1 className="type-display">Decryption key</h1>
            <p className="content-body" style={{ marginTop: "0.5rem" }}>
              Enter the decryption key for the vault you selected.
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
                  className="legacy-btn legacy-btn-primary"
                  style={{ width: "auto" }}
                  disabled={loading || !passphrase.trim()}
                >
                  {loading ? "Opening…" : "Open vault"}
                </button>
              </div>
            </form>
          </div>
        </main>
      </>
    );
  }

  if (step === "open-key" && !importFile) {
    return (
      <>
        <TextureOverlay />
        <main className="legacy-standalone">
          <div className="legacy-card">
            <h1 className="type-display">LegacyLink</h1>
            <p className="content-body" style={{ marginTop: "0.5rem" }}>
              Import a vault file or create a new one. You choose where the vault file is saved.
            </p>
            <div style={formColumnStyle}>
              <button
                type="button"
                className="legacy-btn"
                style={{ width: "100%" }}
                onClick={() => void handleOpenFilePicker()}
              >
                Import vault <span>→</span>
              </button>
              <button
                type="button"
                className="legacy-btn"
                style={{ width: "100%" }}
                onClick={handleCreateNewClick}
              >
                Create a new one <span>+</span>
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  return null;
}
