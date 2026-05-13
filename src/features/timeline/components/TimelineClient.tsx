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
    <div className="space-y-7">
      {/* Narrativa semanal */}
      {weeklyNarrative && (
        <NarrativeCard text={weeklyNarrative.text} isAI={weeklyNarrative.isAI} />
      )}

      {/* Resumo da semana — capítulo principal */}
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

      {/* Separador visual antes da timeline dia-a-dia */}
      {dayGroups.length > 0 && (
        <div className="flex items-center gap-3" aria-hidden="true">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50">
            Dias
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>
      )}

      {/* Timeline dia a dia */}
      <section aria-label="Registros diários" className="space-y-7">
        {dayGroups.map((group) => (
          <TimelineDayGroup key={group.date} group={group} />
        ))}
      </section>

      {/* Paginação */}
      {cursor && (
        <div className="flex justify-center pb-4">
          <button
            onClick={loadMore}
            disabled={isPending}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-6 text-sm font-medium text-muted-foreground shadow-xs transition-all hover:text-foreground hover:shadow-card disabled:opacity-50"
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
