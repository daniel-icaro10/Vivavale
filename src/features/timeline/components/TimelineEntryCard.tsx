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
    <div
      className="flex items-center gap-3"
      role="group"
      aria-label={`${label}: ${value} de ${max}`}
    >
      <span className="w-14 shrink-0 text-[11px] text-muted-foreground/50">
        {label}
      </span>
      <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-border/40">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-primary/25"
          style={{ width: `${pct}%` }}
          aria-hidden="true"
        />
      </div>
      <span
        className="w-4 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground/50"
        aria-hidden="true"
      >
        {value}
      </span>
    </div>
  );
}

export function TimelineEntryCard({ log }: { log: DailyLog }) {
  return (
    <div className="pl-1 space-y-3">
      {/* Notas ganham prioridade visual — leitura editorial */}
      {log.notes && (
        <div
          className="pl-3 mb-1"
          style={{ borderLeft: "2px solid oklch(0.540 0.138 277 / 0.15)" }}
        >
          <p className="text-[15px] leading-7 text-foreground/80">
            {log.notes}
          </p>
        </div>
      )}
      {/* Métricas — secondárias, leves */}
      <div className="space-y-2.5">
        <MetricBar label="Dor" value={log.pain_level} />
        <MetricBar label="Fadiga" value={log.fatigue_level} />
        <MetricBar label="Sono" value={log.sleep_quality} />
        <MetricBar label="Humor" value={log.mood_level} />
        <MetricBar label="Ansiedade" value={log.anxiety_level} />
      </div>
    </div>
  );
}
