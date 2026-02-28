import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, cleanup } from "@testing-library/react";
import { useState } from "react";
import { VaultProvider, useVault } from "./VaultContext";

function createMockHandle(): FileSystemFileHandle {
  return {
    kind: "file",
    name: "vault.json",
    getFile: () => Promise.resolve(new File([], "vault.json")),
    createWritable: () =>
      Promise.resolve({
        write: () => Promise.resolve(),
        close: () => Promise.resolve(),
      } as unknown as FileSystemWritableFileStream),
    isSameEntry: () => Promise.resolve(false),
  } as FileSystemFileHandle;
}

vi.mock("../storage/file-vault-storage", () => ({
  readVaultFromFile: vi.fn(),
  writeVaultToHandle: vi.fn(() => Promise.resolve()),
  buildPayloadForSave: vi.fn((_prev: unknown, newCurrent: unknown) => ({
    current: newCurrent,
    versions: [],
    versionHistoryLimit: 10,
  })),
}));

const mockHandle = createMockHandle();

function TestConsumer() {
  const v = useVault();
  const [lastId, setLastId] = useState<string | null>(null);
  const handleCreateEntry = async () => {
    const entry = await v.createEntry("legacy-system", "Test Entry", {
      "section-id": { "field-id": "value" },
    });
    if (entry) setLastId(entry.id);
  };
  return (
    <div data-testid="vault-consumer">
      <span data-testid="has-store">{String(v.hasExistingStore)}</span>
      <span data-testid="unlocked">{String(v.isUnlocked)}</span>
      <button
        type="button"
        onClick={() => v.createNewStoreWithHandle(mockHandle, "key1")}
      >
        Create Store
      </button>
      <button type="button" onClick={handleCreateEntry}>
        Create Entry
      </button>
      <span data-testid="entry-title">
        {lastId ? v.getEntry(lastId)?.title ?? "missing" : "none"}
      </span>
    </div>
  );
}

function getConsumer() {
  const consumers = screen.getAllByTestId("vault-consumer");
  const el = consumers[0]!;
  return {
    get hasStore() {
      return el.querySelector("[data-testid=has-store]")?.textContent ?? "";
    },
    get unlocked() {
      return el.querySelector("[data-testid=unlocked]")?.textContent ?? "";
    },
    get entryTitle() {
      return el.querySelector("[data-testid=entry-title]")?.textContent ?? "";
    },
    get createStoreButton() {
      return Array.from(el.querySelectorAll("button")).find(
        (b) => b.textContent === "Create Store"
      ) as HTMLButtonElement;
    },
    get createEntryButton() {
      return Array.from(el.querySelectorAll("button")).find(
        (b) => b.textContent === "Create Entry"
      ) as HTMLButtonElement;
    },
  };
}

describe("VaultContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    cleanup();
  });

  it("starts with hasExistingStore false when no store", async () => {
    render(
      <VaultProvider>
        <TestConsumer />
      </VaultProvider>
    );
    await waitFor(() => {
      expect(getConsumer().hasStore).toBe("false");
    });
    expect(getConsumer().unlocked).toBe("false");
  });

  it("createNewStoreWithHandle unlocks and allows createEntry", async () => {
    render(
      <VaultProvider>
        <TestConsumer />
      </VaultProvider>
    );
    await waitFor(() => {
      expect(getConsumer().hasStore).toBe("false");
    });
    fireEvent.click(getConsumer().createStoreButton);
    await waitFor(() => {
      expect(getConsumer().unlocked).toBe("true");
    });
    fireEvent.click(getConsumer().createEntryButton);
    await waitFor(() => {
      expect(getConsumer().entryTitle).toBe("Test Entry");
    });
  });
});
