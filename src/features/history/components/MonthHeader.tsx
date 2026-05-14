interface MonthHeaderProps {
  id: string;
  label: string; // "Maio 2026"
}

export function MonthHeader({ id, label }: MonthHeaderProps) {
  return (
    <div className="mb-5 flex items-center gap-4" aria-labelledby={id}>
      <p id={id} className="vl-eyebrow shrink-0">
        {label}
      </p>
      <div className="h-px flex-1 bg-border/50" aria-hidden="true" />
    </div>
  );
}
