import type { Metadata } from "next";
import { createServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/layout/PageHeader";
import { TimelineClient } from "@/features/timeline/components/TimelineClient";
import { TimelineEmptyState } from "@/features/timeline/components/TimelineEmptyState";
import type { DailyLog } from "@/types/app";
import { TIMELINE_PAGE_SIZE } from "@/features/insights/constants/thresholds";
import { computeWeeklyInsights } from "@/features/insights/engine/computeWeeklyInsights";
import { getWeekStart, getWeekEnd } from "@/features/timeline/utils/groupByDay";
import { generateNarrative } from "@/features/ai/services/generateNarrative";
import type { NarrativeResult } from "@/features/ai/types/narrative";
import type { WeeklyInsights } from "@/features/insights/types/insights";

export const metadata: Metadata = {
  title: "Evolução",
};

async function getInitialLogs(): Promise<{ logs: DailyLog[]; nextCursor: string | null }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { logs: [], nextCursor: null };

  const { data } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(TIMELINE_PAGE_SIZE);

  const logs = data ?? [];
  const nextCursor = logs.length === TIMELINE_PAGE_SIZE ? logs[logs.length - 1].date : null;

  return { logs, nextCursor };
}

function buildCurrentWeekInsights(logs: DailyLog[]): WeeklyInsights | null {
  if (logs.length === 0) return null;
  const weekStart = getWeekStart(logs[0].date);
  const weekEnd = getWeekEnd(weekStart);
  const prevWeekStart = getPreviousWeekStart(weekStart);
  const currentWeekLogs = logs.filter((l) => l.date >= weekStart && l.date <= weekEnd);
  const previousWeekLogs = logs.filter((l) => l.date >= prevWeekStart && l.date < weekStart);
  if (currentWeekLogs.length === 0) return null;
  return computeWeeklyInsights(currentWeekLogs, previousWeekLogs, weekStart, weekEnd);
}

function getPreviousWeekStart(weekStart: string): string {
  const [y, m, d] = weekStart.split("-").map(Number);
  return new Date(y, m - 1, d - 7).toISOString().slice(0, 10);
}

export default async function TimelinePage() {
  const { logs, nextCursor } = await getInitialLogs();

  if (logs.length === 0) {
    return (
      <>
        <PageHeader title="Evolução" description="Como você tem se sentido ao longo do tempo" />
        <TimelineEmptyState />
      </>
    );
  }

  const weeklyInsights = buildCurrentWeekInsights(logs);

  // Gera narrativa e reflexão em paralelo, server-side.
  // Privacy: NarrativeContext contém apenas scores agregados — sem PII.
  let weeklyNarrative: NarrativeResult | null = null;
  let timelineReflection: NarrativeResult | null = null;

  if (weeklyInsights) {
    const ctx = {
      daysLogged: weeklyInsights.daysLogged,
      avgPain: weeklyInsights.avgPain,
      avgFatigue: weeklyInsights.avgFatigue,
      avgSleep: weeklyInsights.avgSleep,
      avgMood: weeklyInsights.avgMood,
      trends: weeklyInsights.trends.map((t) => ({
        dimension: t.dimension,
        trend: t.trend,
      })),
      correlations: weeklyInsights.correlations.map((c) => ({
        label: c.label,
        strength: c.strength,
      })),
    };

    [weeklyNarrative, timelineReflection] = await Promise.all([
      generateNarrative(ctx, "weekly_summary"),
      weeklyInsights.correlations.length > 0 || weeklyInsights.trends.length > 0
        ? generateNarrative(ctx, "timeline_reflection")
        : Promise.resolve(null),
    ]);
  }

  return (
    <>
      <PageHeader title="Evolução" description="Como você tem se sentido ao longo do tempo" />
      <TimelineClient
        initialLogs={logs}
        initialCursor={nextCursor}
        weeklyNarrative={weeklyNarrative}
        timelineReflection={timelineReflection}
      />
    </>
  );
}
