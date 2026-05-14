import type { DayGroup } from "@/features/insights/types/insights";
import { TimelineEntryCard } from "./TimelineEntryCard";

export function TimelineDayGroup({ group }: { group: DayGroup }) {
  return (
    <section
      aria-labelledby={`day-${group.date}`}
      className="animate-in fade-in-0 duration-300"
    >
      {/* Rótulo editorial com linha separadora */}
      <div className="flex items-center gap-3 mb-5">
        <h3
          id={`day-${group.date}`}
          className="shrink-0 text-xs font-medium uppercase tracking-widest text-muted-foreground/50"
        >
          {group.label}
        </h3>
        <div className="h-px flex-1 bg-border/50" aria-hidden="true" />
      </div>
      <div className="space-y-6">
        {group.logs.map((log) => (
          <TimelineEntryCard key={log.id} log={log} />
        ))}
      </div>
    </section>
  );
}
