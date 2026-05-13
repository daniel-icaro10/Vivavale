import type { CorrelationInsight } from "@/features/insights/types/insights";

export function CorrelationCard({ correlation }: { correlation: CorrelationInsight }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{correlation.label}</p>
        {correlation.strength === "strong" && (
          <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
            Padrão consistente
          </span>
        )}
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{correlation.body}</p>
    </div>
  );
}
