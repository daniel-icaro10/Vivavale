import type { DailyLog } from "@/types/app";

function MetricBar({
  label,
  value,
  max = 10,
}: {
  label: string;
  value: number;
  max?: number;
}) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-3" role="group" aria-label={`${label}: ${value} de ${max}`}>
      <span className="w-16 shrink-0 text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-border">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-primary/50"
          style={{ width: `${pct}%` }}
          aria-hidden="true"
        />
      </div>
      <span
        className="w-5 shrink-0 text-right text-xs font-medium tabular-nums text-muted-foreground"
        aria-hidden="true"
      >
        {value}
      </span>
    </div>
  );
}

export function TimelineEntryCard({ log }: { log: DailyLog }) {
  return (
    <div
      className="rounded-2xl bg-card px-5 py-5 shadow-xs space-y-3"
      style={{ border: "1px solid oklch(0.928 0.010 85)" }}
    >
      <div className="space-y-2.5">
        <MetricBar label="Dor"       value={log.pain_level} />
        <MetricBar label="Fadiga"    value={log.fatigue_level} />
        <MetricBar label="Sono"      value={log.sleep_quality} />
        <MetricBar label="Humor"     value={log.mood_level} />
        <MetricBar label="Ansiedade" value={log.anxiety_level} />
      </div>
      {log.notes && (
        <p
          className="pt-2.5 text-sm leading-relaxed text-muted-foreground line-clamp-3"
          style={{ borderTop: "1px solid oklch(0.928 0.010 85)" }}
        >
          {log.notes}
        </p>
      )}
    </div>
  );
}
