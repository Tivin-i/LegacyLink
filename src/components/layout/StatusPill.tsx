interface StatusPillProps {
  label: string;
  pulse?: boolean;
}

export function StatusPill({ label, pulse = true }: StatusPillProps) {
  return (
    <div className="status-pill">
      {pulse && <div className="status-dot" aria-hidden />}
      {label}
    </div>
  );
}
