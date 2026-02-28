import React from "react";
import { Link, useMatch } from "react-router-dom";

interface NavItemProps {
  to: string;
  children: React.ReactNode;
  sup?: string;
  sub?: string;
  end?: boolean;
}

export function NavItem({ to, children, sup, sub, end = false }: NavItemProps) {
  const match = useMatch(end ? to : `${to}/*`);
  const active = !!match;

  return (
    <li>
      <Link
        to={to}
        className={`nav-item ${active ? "active" : ""}`}
        aria-current={active ? "page" : undefined}
      >
        {children}
        {sup != null && <sup>{sup}</sup>}
        {sub != null && <small className="nav-item-sub">{sub}</small>}
      </Link>
    </li>
  );
}
