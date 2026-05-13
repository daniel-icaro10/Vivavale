import type { WeeklyInsights } from "@/features/insights/types/insights";
import type { DailyLog } from "@/types/app";
import { MetricSparkline } from "./MetricSparkline";

function formatWeekRange(start: string, end: string): string {
  const [sy, sm, sd] = start.split("-").map(Number);
  const [, em, ed] = end.split("-").map(Number);
  const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  if (sm === em) return `${sd}–${ed} de ${MONTHS[sm - 1]}`;
  return `${sd} ${MONTHS[sm - 1]} – ${ed} ${MONTHS[em - 1]}`;
}

function TrendBadge({ trend }: { trend: WeeklyInsights["trends"][number] }) {
  const colors: Record<string, string> = {
    improving: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    worsening: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
    stable: "bg-muted text-muted-foreground",
    insufficient_data: "bg-muted text-muted-foreground",
  };
  const icons: Record<string, string> = {
    improving: "↗",
    worsening: "↘",
    stable: "→",
    insufficient_data: "–",
  };
  return (
    <div
      className={`rounded-xl border border-border bg-card px-4 py-3 ${colors[trend.trend] ?? ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{trend.label}</p>
        <span className="text-lg" aria-hidden="true">{icons[trend.trend]}</span>
      </div>
      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{trend.body}</p>
    </div>
  );
}

interface WeeklySummaryCardProps {
  insights: WeeklyInsights;
  sparkLogs: DailyLog[];
}

export function WeeklySummaryCard({ insights, sparkLogs }: WeeklySummaryCardProps) {
  const sparkPain = sparkLogs
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((l) => ({ date: l.date.slice(5), value: l.pain_level }));

  const sparkSleep = sparkLogs
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((l) => ({ date: l.date.slice(5), value: l.sleep_quality }));

  return (
    <section
      aria-labelledby="weekly-summary-heading"
      className="rounded-2xl border border-border bg-card px-5 py-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h2
          id="weekly-summary-heading"
          className="text-sm font-semibold text-foreground"
        >
          Semana de {formatWeekRange(insights.weekStart, insights.weekEnd)}
        </h2>
        <span className="text-xs text-muted-foreground">
          {insights.daysLogged} dia{insights.daysLogged !== 1 ? "s" : ""}
        </span>
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">{insights.summary}</p>

      {sparkPain.length >= 2 && (
        <div className="grid grid-cols-2 gap-4">
          <MetricSparkline data={sparkPain} label="Dor" />
          <MetricSparkline data={sparkSleep} label="Sono" />
        </div>
      )}

      {insights.trends.length > 0 && (
        <div className="space-y-2">
          {insights.trends.map((t) => (
            <TrendBadge key={t.dimension} trend={t} />
          ))}
        </div>
      )}
    </section>
  );
}
