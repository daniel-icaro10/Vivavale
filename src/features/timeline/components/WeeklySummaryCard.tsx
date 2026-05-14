"use client";

import { useState } from "react";
import type { WeeklyInsights } from "@/features/insights/types/insights";
import type { DailyLog } from "@/types/app";
import { MetricSparkline } from "./MetricSparkline";

function formatWeekRange(start: string, end: string): string {
  const [, sm, sd] = start.split("-").map(Number);
  const [, em, ed] = end.split("-").map(Number);
  const MONTHS = [
    "jan", "fev", "mar", "abr", "mai", "jun",
    "jul", "ago", "set", "out", "nov", "dez",
  ];
  if (sm === em) return `${sd}–${ed} de ${MONTHS[sm - 1]}`;
  return `${sd} ${MONTHS[sm - 1]} – ${ed} ${MONTHS[em - 1]}`;
}

const TREND_DIRECTION: Record<string, { icon: string; color: string }> = {
  improving:         { icon: "↑", color: "oklch(0.400 0.100 155)" },
  worsening:         { icon: "↓", color: "oklch(0.500 0.160 25)"  },
  stable:            { icon: "→", color: "oklch(0.476 0.020 258)" },
  insufficient_data: { icon: "–", color: "oklch(0.476 0.020 258)" },
};

function TrendRow({ trend }: { trend: WeeklyInsights["trends"][number] }) {
  const dir = TREND_DIRECTION[trend.trend] ?? TREND_DIRECTION.stable;
  return (
    <div className="py-2 space-y-1">
      {/* Narrativa primeiro — dado técnico como metadado sutil */}
      <p className="text-[13px] leading-relaxed text-foreground/80">{trend.body}</p>
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] text-muted-foreground/40">{trend.label}</span>
        <span
          className="text-[11px] font-medium"
          style={{ color: dir.color }}
          aria-hidden="true"
        >
          {dir.icon}
        </span>
      </div>
    </div>
  );
}

interface WeeklySummaryCardProps {
  insights: WeeklyInsights;
  sparkLogs: DailyLog[];
}

const TRENDS_PREVIEW = 2;

export function WeeklySummaryCard({ insights, sparkLogs }: WeeklySummaryCardProps) {
  const [trendsExpanded, setTrendsExpanded] = useState(false);

  const sorted = sparkLogs.slice().sort((a, b) => a.date.localeCompare(b.date));
  const sparkPain  = sorted.map((l) => ({ date: l.date.slice(5), value: l.pain_level }));
  const sparkSleep = sorted.map((l) => ({ date: l.date.slice(5), value: l.sleep_quality }));

  const visibleTrends = trendsExpanded
    ? insights.trends
    : insights.trends.slice(0, TRENDS_PREVIEW);
  const hasMoreTrends = insights.trends.length > TRENDS_PREVIEW;

  return (
    <section
      aria-labelledby="weekly-summary-heading"
      className="rounded-2xl bg-card shadow-card space-y-5 px-5 py-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
      style={{ border: "1px solid oklch(0.940 0.007 85)" }}
    >
      {/* Header — editorial, sem badge */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">
          Semana · {insights.daysLogged} dia{insights.daysLogged !== 1 ? "s" : ""}
        </p>
        <h2
          id="weekly-summary-heading"
          className="mt-1 text-base font-semibold text-foreground"
        >
          {formatWeekRange(insights.weekStart, insights.weekEnd)}
        </h2>
      </div>

      {/* Resumo narrativo — memória, não análise */}
      <p className="text-[15px] leading-[1.8] text-muted-foreground max-w-reading">
        {insights.summary}
      </p>

      {/* Sparklines — textura, não gráfico técnico */}
      {sparkPain.length >= 2 && (
        <div className="grid grid-cols-2 gap-4">
          <MetricSparkline data={sparkPain}  label="Dor"  color="oklch(0.545 0.155 277 / 0.7)" />
          <MetricSparkline data={sparkSleep} label="Sono" color="oklch(0.720 0.115 228 / 0.7)" />
        </div>
      )}

      {/* Tendências — narrativas como linhas de diário */}
      {insights.trends.length > 0 && (
        <div className="space-y-0 divide-y divide-border/40">
          {visibleTrends.map((t) => (
            <TrendRow key={t.dimension} trend={t} />
          ))}
          {hasMoreTrends && !trendsExpanded && (
            <button
              onClick={() => setTrendsExpanded(true)}
              className="w-full pt-3 text-[11px] font-medium uppercase tracking-widest text-muted-foreground/40 hover:text-muted-foreground transition-colors"
            >
              ver mais
            </button>
          )}
        </div>
      )}
    </section>
  );
}
