import type { CorrelationInsight } from "@/features/insights/types/insights";

export function CorrelationCard({ correlation }: { correlation: CorrelationInsight }) {
  return (
    <div
      className="py-2 pl-4"
      style={{ borderLeft: "2px solid oklch(0.540 0.138 277 / 0.12)" }}
    >
      <p className="text-[14px] font-medium leading-relaxed text-foreground/80">
        {correlation.label}
      </p>
      <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground/70">
        {correlation.body}
      </p>
    </div>
  );
}
