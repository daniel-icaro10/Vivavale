"use client";

import { useState, useTransition } from "react";
import type { DailyLog } from "@/types/app";
import type { WeeklyInsights, DayGroup } from "@/features/insights/types/insights";
import { groupByDay, getWeekStart, getWeekEnd } from "@/features/timeline/utils/groupByDay";
import { computeWeeklyInsights } from "@/features/insights/engine/computeWeeklyInsights";
import { loadMoreLogsAction } from "@/features/timeline/actions";
import { TimelineDayGroup } from "./TimelineDayGroup";
import { WeeklySummaryCard } from "./WeeklySummaryCard";
import { PatternInsightCard } from "./PatternInsightCard";
import { Spinner } from "@/components/ui/spinner";

interface TimelineClientProps {
  initialLogs: DailyLog[];
  initialCursor: string | null;
}

function buildWeeklyInsights(logs: DailyLog[]): WeeklyInsights | null {
  if (logs.length === 0) return null;

  // Use the most recent week present in logs
  const latestDate = logs[0].date;
  const weekStart = getWeekStart(latestDate);
  const weekEnd = getWeekEnd(weekStart);

  const currentWeekLogs = logs.filter(
    (l) => l.date >= weekStart && l.date <= weekEnd,
  );
  const previousWeekLogs = logs.filter(
    (l) => l.date >= getPreviousWeekStart(weekStart) && l.date < weekStart,
  );

  if (currentWeekLogs.length === 0) return null;

  return computeWeeklyInsights(currentWeekLogs, previousWeekLogs, weekStart, weekEnd);
}

function getPreviousWeekStart(weekStart: string): string {
  const [y, m, d] = weekStart.split("-").map(Number);
  const date = new Date(y, m - 1, d - 7);
  return date.toISOString().slice(0, 10);
}

export function TimelineClient({ initialLogs, initialCursor }: TimelineClientProps) {
  const [logs, setLogs] = useState<DailyLog[]>(initialLogs);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [isPending, startTransition] = useTransition();

  const dayGroups: DayGroup[] = groupByDay(logs);
  const weeklyInsights = buildWeeklyInsights(logs);

  function loadMore() {
    if (!cursor) return;
    startTransition(async () => {
      const result = await loadMoreLogsAction(cursor);
      if ("error" in result) return;
      setLogs((prev) => [...prev, ...result.logs]);
      setCursor(result.nextCursor);
    });
  }

  return (
    <div className="space-y-6">
      {/* Resumo semanal + correlações da semana atual */}
      {weeklyInsights && (
        <WeeklySummaryCard
          insights={weeklyInsights}
          sparkLogs={logs.filter(
            (l) => l.date >= weeklyInsights.weekStart && l.date <= weeklyInsights.weekEnd,
          )}
        />
      )}

      {weeklyInsights && weeklyInsights.correlations.length > 0 && (
        <PatternInsightCard correlations={weeklyInsights.correlations} />
      )}

      {/* Timeline dia a dia */}
      <section aria-label="Registros diários" className="space-y-5">
        {dayGroups.map((group) => (
          <TimelineDayGroup key={group.date} group={group} />
        ))}
      </section>

      {/* Paginação */}
      {cursor && (
        <div className="flex justify-center pb-6">
          <button
            onClick={loadMore}
            disabled={isPending}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50 motion-reduce:transition-none"
          >
            {isPending ? (
              <>
                <Spinner className="h-4 w-4" aria-hidden="true" />
                Carregando…
              </>
            ) : (
              "Ver registros anteriores"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
