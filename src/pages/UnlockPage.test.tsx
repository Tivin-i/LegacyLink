import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";
expect.extend(matchers);
import { render, screen, waitFor, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { VaultProvider } from "../context/VaultContext";
import { UnlockPage } from "./UnlockPage";
import type { StoredEncryptedBlob } from "../crypto/vault-crypto";

const store = vi.hoisted(() => ({ blob: null as StoredEncryptedBlob | null }));

vi.mock("../storage/db", () => ({
  readVaultBlob: () => Promise.resolve(store.blob),
  writeVaultBlob: (b: StoredEncryptedBlob) => {
    store.blob = b;
    return Promise.resolve();
  },
  clearVault: () => {
    store.blob = null;
    return Promise.resolve();
  },
}));

vi.mock("../auth/passkey", () => ({
  isPasskeySupported: () => false,
  isPasskeyConfigured: () => Promise.resolve(false),
  authenticateWithPasskey: () => Promise.resolve({ ok: false, error: "not supported" }),
}));

function App() {
  return (
    <MemoryRouter initialEntries={["/"]}>
      <VaultProvider>
        <Routes>
          <Route path="/" element={<UnlockPage />} />
          <Route path="/entries" element={<div data-testid="entries-page">Entries</div>} />
        </Routes>
      </VaultProvider>
    </MemoryRouter>
  );
}

describe("UnlockPage", () => {
  beforeEach(() => {
    store.blob = null;
  });
  afterEach(() => {
    cleanup();
  });

  it("when no store exists shows choice: Create new Store and Open existing Store", async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/create new legacylink store/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/open existing legacylink store/i)).toBeInTheDocument();
  });

  it("when no store, clicking Create new Store shows create-key form", async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /create new legacylink store/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /create new legacylink store/i }));
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Decryption key…")).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText("Confirm decryption key…")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create store/i })).toBeInTheDocument();
  });

  it("creating new store with matching keys unlocks and navigates to entries", async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /create new legacylink store/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /create new legacylink store/i }));
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Decryption key…")).toBeInTheDocument();
    });
    const keyInput = screen.getByPlaceholderText("Decryption key…");
    const confirmInput = screen.getByPlaceholderText("Confirm decryption key…");
    fireEvent.change(keyInput, { target: { value: "my-secret-key" } });
    fireEvent.change(confirmInput, { target: { value: "my-secret-key" } });
    fireEvent.click(screen.getByRole("button", { name: /create store/i }));
    await waitFor(() => {
      expect(screen.getByTestId("entries-page")).toBeInTheDocument();
    });
  });

  it("when store exists shows unlock form", async () => {
    const { createAndSaveEmptyVault } = await import("../vault/vault-service");
    await createAndSaveEmptyVault("key1");
    render(<App />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/decryption key/i)).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /unlock/i })).toBeInTheDocument();
  });

  it("unlock with correct key navigates to entries", async () => {
    const { createAndSaveEmptyVault } = await import("../vault/vault-service");
    await createAndSaveEmptyVault("key1");
    render(<App />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/decryption key/i)).toBeInTheDocument();
    });
    fireEvent.change(screen.getByPlaceholderText(/decryption key/i), {
      target: { value: "key1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /unlock/i }));
    await waitFor(() => {
      expect(screen.getByTestId("entries-page")).toBeInTheDocument();
    });
  });
});
