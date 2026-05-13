interface AIInsightBadgeProps {
  className?: string;
}

export function AIInsightBadge({ className }: AIInsightBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${className ?? ""}`}
      style={{
        background: "oklch(0.928 0.010 85)",
        color: "oklch(0.476 0.020 258)",
        border: "1px solid oklch(0.910 0.012 85)",
      }}
      title="Texto gerado por modelo de linguagem com base nos seus registros"
    >
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: "oklch(0.545 0.155 277 / 0.45)" }}
      />
      Resumo assistido
    </span>
  );
}
