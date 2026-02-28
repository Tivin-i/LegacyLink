import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, cleanup } from "@testing-library/react";
import { useState } from "react";
import { VaultProvider, useVault } from "./VaultContext";
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
  registerPasskey: () => Promise.resolve({ ok: true }),
}));

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
      <button type="button" onClick={() => v.createNewStore("key1")}>
        Create Store
      </button>
      <button type="button" onClick={() => v.unlock("key1")}>
        Unlock
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
    get unlockButton() {
      return Array.from(el.querySelectorAll("button")).find(
        (b) => b.textContent === "Unlock"
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
    store.blob = null;
  });
  afterEach(() => {
    cleanup();
  });

  it("starts with hasExistingStore null then false when no store", async () => {
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

  it("createNewStore unlocks and sets hasExistingStore true", async () => {
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
    expect(getConsumer().hasStore).toBe("true");
  });

  it("createEntry adds entry and getEntry returns it", async () => {
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

  it("unlock with correct key when store exists succeeds", async () => {
    const { createAndSaveEmptyVault } = await import("../vault/vault-service");
    await createAndSaveEmptyVault("key1");
    expect(store.blob).not.toBeNull();

    render(
      <VaultProvider>
        <TestConsumer />
      </VaultProvider>
    );
    await waitFor(() => {
      expect(getConsumer().hasStore).toBe("true");
    });
    fireEvent.click(getConsumer().unlockButton);
    await waitFor(() => {
      expect(getConsumer().unlocked).toBe("true");
    });
  });
});
