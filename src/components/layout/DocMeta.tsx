import React from "react";

interface MetaItem {
  label: string;
  value: React.ReactNode;
}

interface DocMetaProps {
  items: MetaItem[];
}

export function DocMeta({ items }: DocMetaProps) {
  return (
    <div className="doc-meta">
      {items.map((item, i) => (
        <div key={i} className="meta-block">
          <span className="type-label">{item.label}</span>
          <div style={{ fontSize: "1.2rem" }}>{item.value}</div>
        </div>
      ))}
    </div>
  );
}
