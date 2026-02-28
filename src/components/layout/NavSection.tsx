import React from "react";

interface NavSectionProps {
  label: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function NavSection({ label, children, className = "", style }: NavSectionProps) {
  return (
    <div className={`nav-section ${className}`.trim()} style={style}>
      <span className="type-label">{label}</span>
      <ul className="nav-list">{children}</ul>
    </div>
  );
}
