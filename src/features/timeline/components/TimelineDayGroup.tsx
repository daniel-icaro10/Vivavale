import type { DayGroup } from "@/features/insights/types/insights";
import { TimelineEntryCard } from "./TimelineEntryCard";

export function TimelineDayGroup({ group }: { group: DayGroup }) {
  return (
    <section aria-labelledby={`day-${group.date}`}>
      <h3
        id={`day-${group.date}`}
        className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
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
