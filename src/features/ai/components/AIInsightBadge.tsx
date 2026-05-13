interface AIInsightBadgeProps {
  className?: string;
}

export function AIInsightBadge({ className }: AIInsightBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground ${className ?? ""}`}
      title="Texto gerado por modelo de linguagem com base nos seus registros"
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
      Resumo assistido
    </span>
  );
}
