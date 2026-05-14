import type { DayGroup } from "@/features/insights/types/insights";
import { TimelineEntryCard } from "./TimelineEntryCard";

function getTemporalMetricsOpacity(daysOld: number): number {
  if (daysOld < 7)  return 1.0;
  if (daysOld < 14) return 0.72;
  if (daysOld < 28) return 0.55;
  return 0.42;
}

function getTemporalAnimDuration(daysOld: number): string {
  if (daysOld < 7)  return "duration-300";
  if (daysOld < 14) return "duration-400";
  return "duration-500";
}

interface TimelineDayGroupProps {
  group: DayGroup;
  todayStr?: string;
}

export function TimelineDayGroup({ group, todayStr }: TimelineDayGroupProps) {
  const daysOld = todayStr
    ? Math.floor(
        (new Date(todayStr).getTime() - new Date(group.date).getTime()) / 86_400_000,
      )
    : 0;

  const metricsOpacity = getTemporalMetricsOpacity(daysOld);
  const animDuration   = getTemporalAnimDuration(daysOld);

  return (
    <section
      aria-labelledby={`day-${group.date}`}
      className={`animate-in fade-in-0 ${animDuration}`}
    >
      {/* Rótulo editorial com linha separadora */}
      <div className="flex items-center gap-3 pt-3 mb-8">
        <h3
          id={`day-${group.date}`}
          className="shrink-0 vl-eyebrow"
        >
          {group.label}
        </h3>
        <div className="h-px flex-1 bg-border/50" aria-hidden="true" />
      </div>
      <div className="space-y-6">
        {group.logs.map((log) => (
          <TimelineEntryCard key={log.id} log={log} metricsOpacity={metricsOpacity} />
        ))}
      </div>
    </section>
  );
}
