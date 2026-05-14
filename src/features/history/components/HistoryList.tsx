import type { MonthGroup } from "../types";
import { MonthHeader } from "./MonthHeader";
import { HistoryCard } from "./HistoryCard";

interface HistoryListProps {
  groups: MonthGroup[];
  totalLogs: number;
}

export function HistoryList({ groups, totalLogs }: HistoryListProps) {
  return (
    <div className="space-y-10">
      {groups.map((group) => (
        <section key={group.key} aria-labelledby={`month-${group.key}`}>
          <MonthHeader id={`month-${group.key}`} label={group.label} />
          <div className="divide-y divide-border/30">
            {group.logs.map((log) => (
              <HistoryCard key={log.id} log={log} />
            ))}
          </div>
        </section>
      ))}

      {totalLogs >= 30 && (
        <p className="pt-2 text-center vl-metric">
          Mostrando os últimos 30 registros.
        </p>
      )}
    </div>
  );
}
