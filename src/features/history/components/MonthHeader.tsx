interface MonthHeaderProps {
  id: string;
  label: string; // "Maio 2026"
}

export function MonthHeader({ id, label }: MonthHeaderProps) {
  return (
    <h2
      id={id}
      className="mb-4 border-b border-border pb-2 text-sm font-semibold text-foreground/70"
    >
      {label}
    </h2>
  );
}
