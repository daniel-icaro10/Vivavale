interface AIInsightBadgeProps {
  className?: string;
}

export function AIInsightBadge({ className }: AIInsightBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 ${className ?? ""}`}
      title="Texto gerado a partir dos seus registros"
      aria-label="Gerado a partir dos seus registros"
    >
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: "oklch(0.545 0.155 277 / 0.25)" }}
      />
      <span className="text-[10px] text-muted-foreground/30">Gerado</span>
    </span>
  );
}
