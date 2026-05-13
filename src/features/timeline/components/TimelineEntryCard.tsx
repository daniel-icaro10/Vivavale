import type { DailyLog } from "@/types/app";

function MetricRow({ label, value, max = 10 }: { label: string; value: number; max?: number }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 shrink-0 text-xs text-muted-foreground">{label}</span>
      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-primary/60"
          style={{ width: `${pct}%` }}
          aria-hidden="true"
        />
      </div>
      <span className="w-5 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
        {value}
      </span>
    </div>
  );
}

export function TimelineEntryCard({ log }: { log: DailyLog }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-4 space-y-2.5">
      <div className="space-y-2">
        <MetricRow label="Dor" value={log.pain_level} />
        <MetricRow label="Fadiga" value={log.fatigue_level} />
        <MetricRow label="Sono" value={log.sleep_quality} />
        <MetricRow label="Humor" value={log.mood_level} />
        <MetricRow label="Ansiedade" value={log.anxiety_level} />
      </div>
      {log.notes && (
        <p className="pt-1 text-xs leading-relaxed text-muted-foreground line-clamp-3 border-t border-border">
          {log.notes}
        </p>
      )}
    </div>
  );
}
