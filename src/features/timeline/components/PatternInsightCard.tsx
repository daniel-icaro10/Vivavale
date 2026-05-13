import type { CorrelationInsight } from "@/features/insights/types/insights";
import { CorrelationCard } from "./CorrelationCard";

interface PatternInsightCardProps {
  correlations: CorrelationInsight[];
}

export function PatternInsightCard({ correlations }: PatternInsightCardProps) {
  if (correlations.length === 0) return null;

  return (
    <section aria-labelledby="patterns-heading" className="space-y-4">
      <h2
        id="patterns-heading"
        className="px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60"
      >
        Padrões observados
      </h2>
      <div className="space-y-3">
        {correlations.map((c) => (
          <CorrelationCard key={`${c.dimensionA}-${c.dimensionB}`} correlation={c} />
        ))}
      </div>
    </section>
  );
}
