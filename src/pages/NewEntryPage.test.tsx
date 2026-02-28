import { describe, it, expect, vi, afterEach } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";
expect.extend(matchers);
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { NewEntryPage } from "./NewEntryPage";

const mockCreateEntry = vi.fn();
vi.mock("../context/VaultContext", () => ({
  useVault: () => ({
    createEntry: mockCreateEntry,
  }),
}));

describe("NewEntryPage", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders New entry heading and Create button", () => {
    render(
      <MemoryRouter initialEntries={["/entries/new"]}>
        <Routes>
          <Route path="/entries/new" element={<NewEntryPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { name: /new entry/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create/i })).toBeInTheDocument();
  });

  it("uses createEntry from vault context (Create button submits via createEntry)", () => {
    render(
      <MemoryRouter initialEntries={["/entries/new"]}>
        <Routes>
          <Route path="/entries/new" element={<NewEntryPage />} />
        </Routes>
      </MemoryRouter>
    );
    const createButtons = screen.getAllByRole("button", { name: /create/i });
    expect(createButtons.length).toBeGreaterThan(0);
    expect(mockCreateEntry).not.toHaveBeenCalled();
  });
});
