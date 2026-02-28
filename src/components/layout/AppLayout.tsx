import React from "react";
import { useNavigate } from "react-router-dom";
import { Brand } from "./Brand";
import { StatusPill } from "./StatusPill";
import { NavSection } from "./NavSection";
import { NavItem } from "./NavItem";
import { useVault } from "../../context/VaultContext";
import { getTemplate } from "../../templates";

interface AppLayoutProps {
  /** Main content (e.g. <Outlet /> or page content) */
  children: React.ReactNode;
  /** Optional right-hand context panel (e.g. for entry detail) */
  contextPanel?: React.ReactNode;
}

export function AppLayout({ children, contextPanel }: AppLayoutProps) {
  const { vault, lock } = useVault();
  const navigate = useNavigate();
  const entries = vault?.entries ?? [];

  const handleLock = () => {
    lock();
    navigate("/", { replace: true });
  };

  return (
    <div className="app-container">
      <header className="legacy-header border-b no-print">
        <Brand />
        <StatusPill label="Local Storage Active" />
        <div className="type-mono">
          VAULT: {vault != null ? "UNLOCKED" : "LOCKED"}
        </div>
        <button
          type="button"
          className="legacy-btn"
          onClick={handleLock}
          style={{ width: "auto", padding: "4px 12px" }}
          aria-label="Lock vault"
        >
          Lock
        </button>
      </header>

      <nav className="legacy-sidebar border-r no-print">
        <NavSection label="System Index:">
          <NavItem to="/entries" sup="(START)" end>
            Overview
          </NavItem>
          {entries.map((entry) => {
            const template = getTemplate(entry.templateId);
            const sub = template?.name ?? undefined;
            return (
              <NavItem
                key={entry.id}
                to={`/entries/${entry.id}`}
                end
                sub={sub}
              >
                {entry.title}
              </NavItem>
            );
          })}
        </NavSection>
        <NavSection
          label="Emergency Protocols:"
          className="border-b"
          style={{ marginTop: "auto", borderTop: "1px solid var(--ink)" }}
        >
          <NavItem to="#" end>
            Power Failure
          </NavItem>
          <NavItem to="/categories" end>
            Categories
          </NavItem>
          <NavItem to="/successor-guide" end>
            For Successors
          </NavItem>
          <NavItem to="/history" end>
            History
          </NavItem>
          <NavItem to="/keys" end>
            Keys &amp; certs
          </NavItem>
          <NavItem to="/print" end>
            Print vault
          </NavItem>
          <NavItem to="/export-import" end>
            Successor Key <sup>(IMPORTANT)</sup>
          </NavItem>
          <NavItem to="/settings" end>
            Settings
          </NavItem>
        </NavSection>
      </nav>

      <main className="legacy-content">{children}</main>

      {contextPanel != null && contextPanel}
    </div>
  );
}
