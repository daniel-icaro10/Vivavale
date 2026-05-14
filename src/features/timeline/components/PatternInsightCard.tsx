import type { CorrelationInsight } from "@/features/insights/types/insights";
import { CorrelationCard } from "./CorrelationCard";

interface PatternInsightCardProps {
  correlations: CorrelationInsight[];
}

export function PatternInsightCard({ correlations }: PatternInsightCardProps) {
  if (correlations.length === 0) return null;

  return (
    <section aria-labelledby="patterns-heading" className="space-y-4 px-1">
      <p id="patterns-heading" className="vl-eyebrow">
        Padrões observados
      </p>
      <div className="space-y-4">
        {correlations.map((c) => (
          <CorrelationCard key={`${c.dimensionA}-${c.dimensionB}`} correlation={c} />
        ))}
      </div>
    </section>
  );
}
