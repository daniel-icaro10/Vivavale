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
          <div className="space-y-3">
            {group.logs.map((log) => (
              <HistoryCard key={log.id} log={log} />
            ))}
          </div>
        </section>
      ))}

      {/* Placeholder visual — será conectado a paginação real futuramente */}
      {totalLogs >= 30 && (
        <div className="pt-2 text-center">
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="rounded-lg border border-border px-6 py-2.5 text-sm text-muted-foreground opacity-50"
          >
            Ver registros anteriores
          </button>
        </div>
      )}
    </div>
  );
}
