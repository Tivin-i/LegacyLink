import React from "react";

interface ActionButtonProps {
  children: React.ReactNode;
  right?: React.ReactNode;
  dashed?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  "aria-label"?: string;
  className?: string;
}

export function ActionButton({
  children,
  right,
  dashed,
  onClick,
  type = "button",
  "aria-label": ariaLabel,
  className = "",
}: ActionButtonProps) {
  return (
    <button
      type={type}
      className={`legacy-btn ${dashed ? "legacy-btn-dashed" : ""} ${className}`.trim()}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {children}
      {right != null && <span>{right}</span>}
    </button>
  );
}
