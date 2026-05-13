import type { CorrelationInsight } from "@/features/insights/types/insights";

export function CorrelationCard({ correlation }: { correlation: CorrelationInsight }) {
  return (
    <div
      className="rounded-xl bg-card px-4 py-4 shadow-xs"
      style={{ border: "1px solid oklch(0.928 0.010 85)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-foreground leading-snug">
          {correlation.label}
        </p>
        {correlation.strength === "strong" && (
          <span
            className="mt-0.5 shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
            style={{
              background: "oklch(0.545 0.155 277 / 0.10)",
              color: "oklch(0.545 0.155 277)",
            }}
          >
            Padrão frequente
          </span>
        )}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {correlation.body}
      </p>
    </div>
  );
}
