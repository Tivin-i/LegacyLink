import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useVault } from "../context/VaultContext";
import {
  isPasskeySupported,
  isPasskeyConfigured,
  authenticateWithPasskey,
} from "../auth/passkey";

export function UnlockPage() {
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [passkeyAvailable, setPasskeyAvailable] = useState(false);
  const { unlock } = useVault();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    if (isPasskeySupported()) {
      isPasskeyConfigured().then((ok) => {
        if (!cancelled) setPasskeyAvailable(ok);
      });
    }
    return () => {
      cancelled = true;
    };
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
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

  return (
    <main className="unlock-page" style={styles.main}>
      <div style={styles.card}>
        <h1 style={styles.title}>LegacyLink</h1>
        <p style={styles.subtitle}>
          Enter your decryption key to open your vault.
        </p>
        <form onSubmit={handleSubmit} style={styles.form}>
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
            style={styles.input}
          />
          {error && (
            <p id="passphrase-error" role="alert" style={styles.error}>
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading || !passphrase.trim()}
            style={styles.button}
            aria-label="Unlock vault"
          >
            {loading ? "Unlocking…" : "Unlock"}
          </button>
        </form>
        {passkeyAvailable && (
          <div style={styles.passkeyRow}>
            <button
              type="button"
              onClick={handlePasskey}
              disabled={loading}
              style={styles.passkeyButton}
              aria-label="Unlock with passkey"
            >
              Unlock with passkey
            </button>
          </div>
        )}
        <p style={styles.hint}>
          Your key is never stored. Keep a backup in a safe place for
          successors.
        </p>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1rem",
  },
  card: {
    width: "100%",
    maxWidth: "400px",
    padding: "2rem",
    background: "#fff",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  title: {
    margin: "0 0 0.25rem",
    fontSize: "1.5rem",
    fontWeight: 600,
  },
  subtitle: {
    margin: "0 0 1.5rem",
    color: "#666",
    fontSize: "0.9375rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  input: {
    padding: "0.75rem 1rem",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "1rem",
  },
  error: {
    margin: 0,
    color: "#b91c1c",
    fontSize: "0.875rem",
  },
  button: {
    padding: "0.75rem 1rem",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "1rem",
    fontWeight: 500,
    cursor: "pointer",
  },
  hint: {
    margin: "1.5rem 0 0",
    fontSize: "0.8125rem",
    color: "#666",
  },
  passkeyRow: {
    marginTop: "1rem",
  },
  passkeyButton: {
    padding: "0.5rem 1rem",
    background: "transparent",
    border: "1px solid #2563eb",
    color: "#2563eb",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.9375rem",
  },
};
