import { afterEach, describe, expect, it, vi } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { VaultData } from "../vault-types";
import { EntryListPage } from "./EntryListPage";

expect.extend(matchers);

const mockVaultState = vi.hoisted(() => ({
  vault: null as VaultData | null,
}));

vi.mock("../context/VaultContext", () => ({
  useVault: () => ({
    vault: mockVaultState.vault,
  }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <EntryListPage />
    </MemoryRouter>
  );
}

describe("EntryListPage", () => {
  afterEach(() => {
    mockVaultState.vault = null;
    cleanup();
  });

  it("falls back to All when the selected category disappears", () => {
    mockVaultState.vault = {
      version: 2,
      entries: [
        {
          id: "entry-1",
          templateId: "legacy-system",
          title: "Alpha system",
          updatedAt: "2026-03-09T00:00:00.000Z",
          sections: {},
          categoryId: "cat-1",
        },
        {
          id: "entry-2",
          templateId: "legacy-system",
          title: "Beta system",
          updatedAt: "2026-03-09T00:00:00.000Z",
          sections: {},
          categoryId: "cat-2",
        },
      ],
      categories: [
        { id: "cat-1", name: "Alpha" },
        { id: "cat-2", name: "Beta" },
      ],
    };

    const { rerender } = renderPage();

    fireEvent.change(screen.getByRole("combobox", { name: /filter by category/i }), {
      target: { value: "cat-1" },
    });

    expect(screen.getByRole("combobox", { name: /filter by category/i })).toHaveValue("cat-1");
    expect(screen.getByRole("link", { name: /open alpha system/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /open beta system/i })).not.toBeInTheDocument();

    mockVaultState.vault = {
      ...mockVaultState.vault,
      categories: [{ id: "cat-2", name: "Beta" }],
    };

    rerender(
      <MemoryRouter>
        <EntryListPage />
      </MemoryRouter>
    );

    expect(screen.getByRole("combobox", { name: /filter by category/i })).toHaveValue("all");
    expect(screen.getByRole("link", { name: /open alpha system/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open beta system/i })).toBeInTheDocument();
    expect(screen.queryByText(/no entries in this category/i)).not.toBeInTheDocument();
  });
});
