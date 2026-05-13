import type { DayGroup } from "@/features/insights/types/insights";
import { TimelineEntryCard } from "./TimelineEntryCard";

export function TimelineDayGroup({ group }: { group: DayGroup }) {
  return (
    <section aria-labelledby={`day-${group.date}`} className="space-y-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      <h3
        id={`day-${group.date}`}
        className="px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60"
      >
        {group.label}
      </h3>
      <div className="space-y-3">
        {group.logs.map((log) => (
          <TimelineEntryCard key={log.id} log={log} />
        ))}
      </div>
    </section>
  );
}
