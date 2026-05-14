interface AIInsightBadgeProps {
  className?: string;
}

export function AIInsightBadge({ className }: AIInsightBadgeProps) {
  return (
    <span
      className={`inline-flex items-center ${className ?? ""}`}
      title="Texto gerado a partir dos seus registros"
      aria-label="Texto gerado a partir dos seus registros"
    >
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: "oklch(0.545 0.155 277 / 0.20)" }}
      />
    </span>
  );
}
