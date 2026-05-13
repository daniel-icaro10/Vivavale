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

const TREND_STYLES: Record<string, { bg: string; text: string; icon: string; label: string }> = {
  improving:        { bg: "oklch(0.958 0.040 155 / 0.5)", text: "oklch(0.400 0.100 155)", icon: "↑", label: "Melhora" },
  worsening:        { bg: "oklch(0.970 0.040 25  / 0.5)", text: "oklch(0.500 0.160 25)",  icon: "↓", label: "Piora"   },
  stable:           { bg: "oklch(0.968 0.008 80  / 0.5)", text: "oklch(0.476 0.020 258)", icon: "→", label: "Estável" },
  insufficient_data:{ bg: "oklch(0.968 0.008 80  / 0.5)", text: "oklch(0.476 0.020 258)", icon: "–", label: "Poucos dados" },
};

function TrendChip({ trend }: { trend: WeeklyInsights["trends"][number] }) {
  const style = TREND_STYLES[trend.trend] ?? TREND_STYLES.stable;
  return (
    <div
      className="rounded-xl px-4 py-3 space-y-1"
      style={{ background: style.bg, border: `1px solid ${style.bg}` }}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">{trend.label}</p>
        <span
          className="text-base font-semibold leading-none"
          style={{ color: style.text }}
          aria-label={`Tendência: ${style.label}`}
        >
          {style.icon}
        </span>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">{trend.body}</p>
    </div>
  );
}

interface WeeklySummaryCardProps {
  insights: WeeklyInsights;
  sparkLogs: DailyLog[];
}

export function WeeklySummaryCard({ insights, sparkLogs }: WeeklySummaryCardProps) {
  const sorted = sparkLogs.slice().sort((a, b) => a.date.localeCompare(b.date));
  const sparkPain  = sorted.map((l) => ({ date: l.date.slice(5), value: l.pain_level }));
  const sparkSleep = sorted.map((l) => ({ date: l.date.slice(5), value: l.sleep_quality }));

  return (
    <section
      aria-labelledby="weekly-summary-heading"
      className="rounded-2xl bg-card shadow-card space-y-5 px-5 py-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-200"
      style={{ border: "1px solid oklch(0.928 0.010 85)" }}
    >
      {/* Header do capítulo */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Semana
          </p>
          <h2
            id="weekly-summary-heading"
            className="mt-0.5 text-base font-semibold text-foreground"
          >
            {formatWeekRange(insights.weekStart, insights.weekEnd)}
          </h2>
        </div>
        <span
          className="rounded-full px-3 py-1 text-xs font-semibold"
          style={{
            background: "oklch(0.968 0.008 80)",
            color: "oklch(0.476 0.020 258)",
          }}
        >
          {insights.daysLogged} dia{insights.daysLogged !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Resumo narrativo */}
      <p className="text-sm leading-relaxed text-muted-foreground">{insights.summary}</p>

      {/* Sparklines */}
      {sparkPain.length >= 2 && (
        <div className="grid grid-cols-2 gap-4">
          <MetricSparkline data={sparkPain}  label="Dor"  color="oklch(0.545 0.155 277)" />
          <MetricSparkline data={sparkSleep} label="Sono" color="oklch(0.720 0.115 228)" />
        </div>
      )}

      {/* Tendências */}
      {insights.trends.length > 0 && (
        <div className="space-y-2">
          {insights.trends.map((t) => (
            <TrendChip key={t.dimension} trend={t} />
          ))}
        </div>
      )}
    </section>
  );
}
