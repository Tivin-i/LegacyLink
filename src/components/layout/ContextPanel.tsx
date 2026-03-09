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
  const hasRelatedLinks = relatedLinks.length > 0;

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
        <Link to="/history" className="legacy-btn" style={{ display: "block", marginBottom: -1 }}>
          View History <span>→</span>
        </Link>
        {onPrint != null && (
          <ActionButton right="↓" onClick={onPrint}>
            Print / PDF
          </ActionButton>
        )}

        {hasRelatedLinks && (
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
      </div>
    </aside>
  );
}
