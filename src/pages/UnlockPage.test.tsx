import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";
expect.extend(matchers);
import { render, screen, waitFor, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { VaultProvider } from "../context/VaultContext";
import { UnlockPage } from "./UnlockPage";

function createMockHandle(): FileSystemFileHandle {
  return {
    kind: "file",
    name: "vault.json",
    getFile: () => Promise.resolve(new File([], "vault.json")),
    createWritable: () =>
      Promise.resolve({
        write: () => Promise.resolve(),
        close: () => Promise.resolve(),
        seek: () => Promise.resolve(),
        truncate: () => Promise.resolve(),
      } as unknown as FileSystemWritableFileStream),
    isSameEntry: () => Promise.resolve(false),
  } as FileSystemFileHandle;
}

const mockHandle = createMockHandle();

vi.mock("../storage/file-vault-storage", () => ({
  readVaultFromFile: vi.fn(),
  writeVaultToHandle: vi.fn(() => Promise.resolve()),
  buildPayloadForSave: vi.fn((_prev: unknown, newCurrent: unknown) => ({
    current: newCurrent,
    versions: [],
    versionHistoryLimit: 10,
  })),
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
    if (typeof window.showSaveFilePicker === "function") {
      vi.mocked(window.showSaveFilePicker).mockReset();
    }
    if (typeof window.showOpenFilePicker === "function") {
      vi.mocked(window.showOpenFilePicker).mockReset();
    }
  });
  afterEach(() => {
    cleanup();
  });

  it("shows choice: Import vault and Create a new one", async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /import vault/i })).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /create a new one/i })).toBeInTheDocument();
  });

  it("clicking Create a new one opens save picker then shows create-key form", async () => {
    (window as unknown as { showSaveFilePicker: () => Promise<FileSystemFileHandle> }).showSaveFilePicker = vi
      .fn()
      .mockResolvedValue(mockHandle);
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /create a new one/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /create a new one/i }));
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Decryption key…")).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText("Confirm decryption key…")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create vault/i })).toBeInTheDocument();
  });

  it("creating new vault with matching keys unlocks and navigates to entries", async () => {
    (window as unknown as { showSaveFilePicker: () => Promise<FileSystemFileHandle> }).showSaveFilePicker = vi
      .fn()
      .mockResolvedValue(mockHandle);
    render(<App />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /create a new one/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /create a new one/i }));
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Decryption key…")).toBeInTheDocument();
    });
    const keyInput = screen.getByPlaceholderText("Decryption key…");
    const confirmInput = screen.getByPlaceholderText("Confirm decryption key…");
    fireEvent.change(keyInput, { target: { value: "my-secret-key" } });
    fireEvent.change(confirmInput, { target: { value: "my-secret-key" } });
    fireEvent.click(screen.getByRole("button", { name: /create vault/i }));
    await waitFor(() => {
      expect(screen.getByTestId("entries-page")).toBeInTheDocument();
    });
  });
});
