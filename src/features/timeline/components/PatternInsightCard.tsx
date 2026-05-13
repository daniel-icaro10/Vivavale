import type { CorrelationInsight } from "@/features/insights/types/insights";
import { CorrelationCard } from "./CorrelationCard";

interface PatternInsightCardProps {
  correlations: CorrelationInsight[];
}

export function PatternInsightCard({ correlations }: PatternInsightCardProps) {
  if (correlations.length === 0) return null;

  return (
    <section aria-labelledby="patterns-heading" className="space-y-3">
      <h2
        id="patterns-heading"
        className="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
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
