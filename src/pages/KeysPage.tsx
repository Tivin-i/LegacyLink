import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useVault } from "../context/VaultContext";
import { ConfirmDeleteModal } from "../components/layout";

const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPT = ".pem,.pub,application/x-pem-file,application/pgp-keys,application/x-x509-ca-cert,.crt,.cer,.der";
const ALLOWED_EXTENSIONS = new Set([".pem", ".pub", ".crt", ".cer", ".der"]);
const INVALID_FILENAME_CHARS = /[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069\\/]/g;

function getFileExtension(filename: string) {
  const dotIndex = filename.lastIndexOf(".");
  return dotIndex === -1 ? "" : filename.slice(dotIndex).toLowerCase();
}

function sanitizeDownloadFilename(filename: string) {
  const sanitized = filename.replace(INVALID_FILENAME_CHARS, "_").trim();
  return sanitized === "" ? "download" : sanitized;
}

function inferUploadedKeyType(extension: string, bytes: Uint8Array) {
  if (extension === ".pub") return "ssh";
  if (extension === ".crt" || extension === ".cer" || extension === ".der") return "cert";
  if (extension !== ".pem") return "cert";

  const pemContent = new TextDecoder().decode(bytes);
  return pemContent.includes("BEGIN CERTIFICATE") ? "cert" : "ssh";
}

export function KeysPage() {
  const { uploadedKeys, addUploadedKey, deleteUploadedKey, getUploadedKey } = useVault();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    setError(null);
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setError(`File too large. Maximum ${MAX_FILE_SIZE_MB} MB.`);
      return;
    }

    const extension = getFileExtension(file.name);
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      setError("Unsupported file type. Use PEM, OpenSSH .pub, .crt, .cer, or .der files.");
      return;
    }

    setUploading(true);
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
      const contentBase64 = btoa(binary);
      const type = inferUploadedKeyType(extension, bytes);
      await addUploadedKey(file.name, type, contentBase64);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = (id: string) => {
    const key = getUploadedKey(id);
    if (!key) return;
    const binary = atob(key.contentBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = sanitizeDownloadFilename(key.name);
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="legacy-content">
      <Link to="/entries" className="legacy-btn" style={{ width: "auto", display: "inline-block", marginBottom: "1.5rem" }}>
        Back to list <span>←</span>
      </Link>
      <h1 className="type-display">Keys &amp; certificates</h1>
      <p className="content-body" style={{ marginTop: "1rem", marginBottom: "2rem" }}>
        Store SSH keys and certificates in the vault (encrypted). Download when needed.
      </p>

      <div style={{ marginBottom: "1.5rem" }}>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          onChange={handleFileSelect}
          aria-label="Choose key or certificate file"
          style={{ position: "absolute", width: "0.1px", height: "0.1px", opacity: 0, overflow: "hidden", zIndex: -1 }}
        />
        <button
          type="button"
          className="legacy-btn"
          style={{ width: "auto" }}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Uploading…" : "Upload key or certificate"} <span>+</span>
        </button>
        <p style={{ fontSize: "0.875rem", opacity: 0.8, marginTop: "0.5rem" }}>
          Max {MAX_FILE_SIZE_MB} MB per file. PEM, OpenSSH .pub, .crt, .cer, and .der supported.
        </p>
      </div>

      {error && (
        <p role="alert" style={{ marginBottom: "1rem", fontSize: "0.875rem" }}>
          {error}
        </p>
      )}

      {uploadedKeys.length === 0 ? (
        <p className="content-body" style={{ opacity: 0.8 }}>No keys uploaded yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {uploadedKeys.map((key) => {
            const uploadedAt = key.uploadedAt ? new Date(key.uploadedAt).toLocaleDateString() : "";
            return (
              <li key={key.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                <span>{key.name}</span>
                <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>({key.type})</span>
                {uploadedAt && <span style={{ fontSize: "0.8rem", opacity: 0.6 }}>{uploadedAt}</span>}
                <button type="button" className="legacy-btn" style={{ width: "auto", padding: "0.25rem 0.5rem" }} onClick={() => handleDownload(key.id)}>
                  Download
                </button>
                <button
                  type="button"
                  className="legacy-btn"
                  style={{ width: "auto", padding: "0.25rem 0.5rem" }}
                  onClick={() => setDeleteTarget({ id: key.id, name: key.name })}
                >
                  Delete
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <ConfirmDeleteModal
        open={deleteTarget != null}
        title="Delete key or certificate?"
        resourceLabel="file"
        resourceName={deleteTarget?.name ?? ""}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteUploadedKey(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
