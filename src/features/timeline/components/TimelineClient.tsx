"use client";

import { useState, useTransition } from "react";
import type { DailyLog } from "@/types/app";
import type { WeeklyInsights, DayGroup } from "@/features/insights/types/insights";
import type { NarrativeResult } from "@/features/ai/types/narrative";
import { groupByDay, getWeekStart, getWeekEnd } from "@/features/timeline/utils/groupByDay";
import { computeWeeklyInsights } from "@/features/insights/engine/computeWeeklyInsights";
import { loadMoreLogsAction } from "@/features/timeline/actions";
import { TimelineDayGroup } from "./TimelineDayGroup";
import { WeeklySummaryCard } from "./WeeklySummaryCard";
import { PatternInsightCard } from "./PatternInsightCard";
import { NarrativeCard } from "@/features/ai/components/NarrativeCard";
import { ReflectionCard } from "@/features/ai/components/ReflectionCard";
import { Spinner } from "@/components/ui/spinner";

interface TimelineClientProps {
  initialLogs: DailyLog[];
  initialCursor: string | null;
  weeklyNarrative?: NarrativeResult | null;
  timelineReflection?: NarrativeResult | null;
}

function buildWeeklyInsights(logs: DailyLog[]): WeeklyInsights | null {
  if (logs.length === 0) return null;
  const latestDate = logs[0].date;
  const weekStart = getWeekStart(latestDate);
  const weekEnd = getWeekEnd(weekStart);
  const currentWeekLogs = logs.filter(
    (l) => l.date >= weekStart && l.date <= weekEnd,
  );
  const previousWeekLogs = logs.filter(
    (l) =>
      l.date >= getPreviousWeekStart(weekStart) && l.date < weekStart,
  );
  if (currentWeekLogs.length === 0) return null;
  return computeWeeklyInsights(
    currentWeekLogs,
    previousWeekLogs,
    weekStart,
    weekEnd,
  );
}

function getPreviousWeekStart(weekStart: string): string {
  const [y, m, d] = weekStart.split("-").map(Number);
  return new Date(y, m - 1, d - 7).toISOString().slice(0, 10);
}

export function TimelineClient({
  initialLogs,
  initialCursor,
  weeklyNarrative,
  timelineReflection,
}: TimelineClientProps) {
  const [logs, setLogs] = useState<DailyLog[]>(initialLogs);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [isPending, startTransition] = useTransition();

  const todayStr = new Date().toLocaleDateString("sv-SE");
  const dayGroups: DayGroup[] = groupByDay(logs, todayStr);
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
    <div className="space-y-10">
      {/* Narrativa semanal — full-bleed editorial */}
      {weeklyNarrative && (
        <div className="-mx-5">
          <NarrativeCard text={weeklyNarrative.text} isAI={weeklyNarrative.isAI} bleed />
        </div>
      )}

      {/* Resumo da semana */}
      {weeklyInsights && (
        <WeeklySummaryCard
          insights={weeklyInsights}
          sparkLogs={logs.filter(
            (l) =>
              l.date >= weeklyInsights.weekStart &&
              l.date <= weeklyInsights.weekEnd,
          )}
        />
      )}

      {/* Padrões de correlação */}
      {weeklyInsights && weeklyInsights.correlations.length > 0 && (
        <PatternInsightCard correlations={weeklyInsights.correlations} />
      )}

      {/* Micro-reflexão */}
      {timelineReflection && (
        <ReflectionCard
          text={timelineReflection.text}
          isAI={timelineReflection.isAI}
        />
      )}

      {/* Timeline dia a dia — ritmo de leitura orgânico */}
      {dayGroups.length > 0 && (
        <section aria-label="Registros diários" className="space-y-12">
          {dayGroups.map((group) => (
            <TimelineDayGroup key={group.date} group={group} />
          ))}
        </section>
      )}

      {/* Paginação */}
      {cursor && (
        <div className="flex justify-center py-2">
          <button
            onClick={loadMore}
            disabled={isPending}
            className="inline-flex items-center gap-2 py-2 text-xs font-medium text-muted-foreground/50 hover:text-muted-foreground transition-colors disabled:opacity-30"
          >
            {isPending ? (
              <>
                <Spinner className="h-3.5 w-3.5" aria-hidden="true" />
                Carregando…
              </>
            ) : (
              "Registros anteriores"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
