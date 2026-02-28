import { Link } from "react-router-dom";
import { ActionButton } from "./ActionButton";

interface ContextPanelProps {
  onEdit?: () => void;
  onPrint?: () => void;
  relatedLinks?: { label: string; to: string }[];
}

export function ContextPanel({
  onEdit,
  onPrint,
  relatedLinks = [],
}: ContextPanelProps) {
  return (
    <aside className="context-panel border-l">
      <div className="context-img border-b">
        <div className="noise-graphic" aria-hidden />
        <span className="context-img-caption">ENCRYPTED</span>
      </div>

      <div className="action-list">
        <span className="type-label">Quick Actions:</span>
        <div style={{ height: "1rem" }} />

        {onEdit != null && (
          <ActionButton right="+" onClick={onEdit}>
            Edit Document
          </ActionButton>
        )}
        <Link to="/entries" className="legacy-btn" style={{ display: "block", marginBottom: -1 }}>
          View History <span>→</span>
        </Link>
        {onPrint != null && (
          <ActionButton right="↓" onClick={onPrint}>
            Print / PDF
          </ActionButton>
        )}

        {relatedLinks.length > 0 && (
          <>
            <div style={{ height: "2rem" }} />
            <span className="type-label">Related Systems:</span>
            <div style={{ height: "1rem" }} />
            {relatedLinks.map(({ label, to }, i) => (
              <Link
                key={i}
                to={to}
                className={`legacy-btn legacy-btn-dashed ${i > 0 ? "legacy-btn-dashed" : ""}`}
                style={{ display: "block", marginBottom: -1, borderTop: i > 0 ? "none" : undefined }}
              >
                {label}
              </Link>
            ))}
          </>
        )}

        {relatedLinks.length === 0 && (
          <>
            <div style={{ height: "2rem" }} />
            <span className="type-label">Related Systems:</span>
            <div style={{ height: "1rem" }} />
            <button type="button" className="legacy-btn legacy-btn-dashed" style={{ marginBottom: -1 }}>
              Firewall Rules
            </button>
            <button type="button" className="legacy-btn legacy-btn-dashed" style={{ borderTop: "none" }}>
              VPN Keys
            </button>
          </>
        )}
      </div>

      <div style={{ marginTop: "auto", padding: "1.5rem" }} className="border-t">
        <div className="type-mono" style={{ fontSize: "0.7rem", opacity: 0.6 }}>
          SYSTEM ID: A1-99<br />
          ENCRYPTION: AES-256<br />
          LOCAL ONLY
        </div>
      </div>
    </aside>
  );
}
