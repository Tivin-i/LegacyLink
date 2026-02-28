import type { ReactNode } from "react";

interface DataRow {
  label: string;
  value: string | ReactNode;
}

interface DataBlockProps {
  title: string;
  badge?: string;
  rows: DataRow[];
}

export function DataBlock({ title, badge, rows }: DataBlockProps) {
  return (
    <div className="data-block">
      <div className="data-label">
        <span>{title}</span>
        {badge != null && <span>{badge}</span>}
      </div>
      {rows.map((row, i) => (
        <div key={i} className="data-row">
          <span>{row.label}</span>
          <span>{row.value}</span>
        </div>
      ))}
    </div>
  );
}
