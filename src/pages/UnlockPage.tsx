import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useVault } from "../context/VaultContext";
import { authenticateWithPasskey } from "../auth/passkey";
import { readStoredBlobFromFile } from "../crypto/vault-crypto";
import type { StoredEncryptedBlob } from "../crypto/vault-crypto";
import { usePasskeyAvailable } from "../hooks/usePasskeyAvailable";
import {
  layout,
  typography,
  buttons,
  forms,
  messages,
  card,
} from "../styles/shared";

type Step =
  | "choice"
  | "create-key"
  | "open-file"
  | "open-key"
  | "unlock";

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
      <main className="unlock-page" style={layout.mainCentered}>
        <div style={card}>
          <p style={messages.muted}>Loading…</p>
        </div>
      </main>
    );
  }

  if (hasExistingStore === false && step === "choice") {
    return (
      <main className="unlock-page" style={layout.mainCentered}>
        <div style={card}>
          <h1 style={typography.titleSmall}>LegacyLink</h1>
          <p style={typography.subtitle}>
            No store on this device. Create a new one or open an existing store from a file.
          </p>
          <div style={forms.formColumn}>
            <button
              type="button"
              onClick={() => {
                setStep("create-key");
                setError(null);
                setPassphrase("");
                setConfirmPassphrase("");
              }}
              style={buttons.primaryLarge}
            >
              Create new LegacyLink Store
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("open-file");
                setError(null);
                setImportFile(null);
              }}
              style={buttons.outline}
            >
              Open existing LegacyLink Store (import from file)
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (hasExistingStore === false && step === "create-key") {
    return (
      <main className="unlock-page" style={layout.mainCentered}>
        <div style={card}>
          <h1 style={typography.titleSmall}>Create new Store</h1>
          <p style={typography.subtitle}>
            Choose a decryption key. You will need it every time you open this store. Keep a backup in a safe place.
          </p>
          <form
            onSubmit={handleCreateStoreSubmit}
            style={forms.formColumn}
          >
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
              style={forms.inputLarge}
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
              style={forms.inputLarge}
            />
            {error && (
              <p id="create-error" role="alert" style={messages.errorInline}>
                {error}
              </p>
            )}
            <div style={forms.formActionsRow}>
              <button
                type="button"
                onClick={goBack}
                disabled={loading}
                style={buttons.outline}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || !passphrase.trim() || !confirmPassphrase.trim()}
                style={buttons.primaryLarge}
              >
                {loading ? "Creating…" : "Create store"}
              </button>
            </div>
          </form>
        </div>
      </main>
    );
  }

  if (hasExistingStore === false && step === "open-file") {
    return (
      <main className="unlock-page" style={layout.mainCentered}>
        <div style={card}>
          <h1 style={typography.titleSmall}>Open existing Store</h1>
          <p style={typography.subtitle}>
            Select an exported LegacyLink store file, then enter its decryption key.
          </p>
          <div style={forms.formColumn}>
            <label htmlFor="store-file" style={forms.labelBlock}>
              Store file
            </label>
            <input
              id="store-file"
              type="file"
              accept=".json,application/json"
              onChange={handleFileSelect}
              style={forms.input}
            />
            {error && (
              <p role="alert" style={messages.errorInline}>
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={goBack}
              style={buttons.outline}
            >
              Back
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (hasExistingStore === false && step === "open-key" && importFile) {
    return (
      <main className="unlock-page" style={layout.mainCentered}>
        <div style={card}>
          <h1 style={typography.titleSmall}>Decryption key</h1>
          <p style={typography.subtitle}>
            Enter the decryption key for the store you selected. It will be checked before importing.
          </p>
          <form
            onSubmit={handleOpenStoreSubmit}
            style={forms.formColumn}
          >
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
              style={forms.inputLarge}
            />
            {error && (
              <p id="import-error" role="alert" style={messages.errorInline}>
                {error}
              </p>
            )}
            <div style={forms.formActionsRow}>
              <button
                type="button"
                onClick={goBack}
                disabled={loading}
                style={buttons.outline}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || !passphrase.trim()}
                style={buttons.primaryLarge}
              >
                {loading ? "Checking…" : "Open store"}
              </button>
            </div>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="unlock-page" style={layout.mainCentered}>
      <div style={card}>
        <h1 style={typography.titleSmall}>LegacyLink</h1>
        <p style={typography.subtitle}>
          Enter your decryption key to open your vault.
        </p>
        <form
          onSubmit={handleUnlockSubmit}
          style={forms.formColumn}
        >
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
            style={forms.inputLarge}
          />
          {error && (
            <p id="passphrase-error" role="alert" style={messages.errorInline}>
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading || !passphrase.trim()}
            style={buttons.primaryLarge}
            aria-label="Unlock vault"
          >
            {loading ? "Unlocking…" : "Unlock"}
          </button>
        </form>
        {passkeyAvailable && (
          <div style={forms.formColumn}>
            <button
              type="button"
              onClick={handlePasskey}
              disabled={loading}
              style={buttons.outline}
              aria-label="Unlock with passkey"
            >
              Unlock with passkey
            </button>
          </div>
        )}
        <p style={{ ...messages.muted, margin: "1.5rem 0 0", fontSize: "0.8125rem" }}>
          Your key is never stored. Keep a backup in a safe place for
          successors.
        </p>
      </div>
    </main>
  );
}
