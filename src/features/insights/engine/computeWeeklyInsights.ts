import type { DailyLog } from "@/types/app";
import type { WeeklyInsights, TemporalInsight } from "../types/insights";
import { computeTrendDirection } from "./computeTrendDirection";
import { computeCorrelations } from "./computeCorrelations";

function avg(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function trendBody(
  label: string,
  trend: WeeklyInsights["trends"][number]["trend"],
  currentAvg: number,
  _previousAvg: number,
): string {
  const rounded = currentAvg.toFixed(1);
  if (trend === "improving")
    return `Você registrou uma melhora em ${label.toLowerCase()} em relação à semana anterior (média ${rounded}).`;
  if (trend === "worsening")
    return `${label} tende a estar um pouco mais elevado esta semana (média ${rounded}). Vale observar.`;
  if (trend === "stable")
    return `${label} permaneceu estável nesta semana (média ${rounded}).`;
  return `Dados insuficientes para identificar tendência em ${label.toLowerCase()}.`;
}

export function computeWeeklyInsights(
  currentWeekLogs: DailyLog[],
  previousWeekLogs: DailyLog[],
  weekStart: string,
  weekEnd: string,
): WeeklyInsights {
  const cur = currentWeekLogs;
  const prev = previousWeekLogs;

  const avgPain = avg(cur.map((l) => l.pain_level));
  const avgFatigue = avg(cur.map((l) => l.fatigue_level));
  const avgSleep = avg(cur.map((l) => l.sleep_quality));
  const avgMood = avg(cur.map((l) => l.mood_level));
  const avgAnxiety = avg(cur.map((l) => l.anxiety_level));

  const prevAvgPain = avg(prev.map((l) => l.pain_level));
  const prevAvgFatigue = avg(prev.map((l) => l.fatigue_level));
  const prevAvgSleep = avg(prev.map((l) => l.sleep_quality));
  const prevAvgMood = avg(prev.map((l) => l.mood_level));

  const dimensions: Array<{
    key: string;
    label: string;
    current: number | null;
    previous: number | null;
    higherIsBetter: boolean;
  }> = [
    { key: "pain", label: "Dor", current: avgPain, previous: prevAvgPain, higherIsBetter: false },
    { key: "fatigue", label: "Fadiga", current: avgFatigue, previous: prevAvgFatigue, higherIsBetter: false },
    { key: "sleep", label: "Sono", current: avgSleep, previous: prevAvgSleep, higherIsBetter: true },
    { key: "mood", label: "Humor", current: avgMood, previous: prevAvgMood, higherIsBetter: true },
  ];

  const trends: TemporalInsight[] = dimensions
    .filter((d) => d.current !== null)
    .map((d) => {
      const trend = computeTrendDirection(d.current, d.previous, d.higherIsBetter);
      return {
        dimension: d.key,
        label: d.label,
        trend,
        currentAvg: d.current!,
        previousAvg: d.previous ?? d.current!,
        body: trendBody(d.label, trend, d.current!, d.previous ?? d.current!),
      };
    })
    .filter((t) => t.trend !== "stable" && t.trend !== "insufficient_data");

  const correlations = computeCorrelations(cur);

  const summary = generateTimelineSummary(avgPain, avgFatigue, avgSleep, avgMood, cur.length);

  return {
    weekStart,
    weekEnd,
    avgPain,
    avgFatigue,
    avgSleep,
    avgMood,
    avgAnxiety,
    daysLogged: cur.length,
    trends,
    correlations,
    summary,
  };
}

function generateTimelineSummary(
  pain: number | null,
  fatigue: number | null,
  sleep: number | null,
  mood: number | null,
  daysLogged: number,
): string {
  if (daysLogged === 0) return "Nenhum registro nesta semana.";
  if (daysLogged === 1) return "Você fez 1 registro nesta semana.";

  const parts: string[] = [];

  if (pain !== null) {
    if (pain <= 3) parts.push("dor em níveis baixos");
    else if (pain <= 6) parts.push("dor em níveis moderados");
    else parts.push("dor em níveis elevados");
  }

  if (sleep !== null) {
    if (sleep >= 7) parts.push("sono satisfatório");
    else if (sleep >= 4) parts.push("sono irregular");
    else parts.push("sono difícil");
  }

  if (mood !== null) {
    if (mood >= 7) parts.push("humor positivo");
    else if (mood >= 4) parts.push("humor variado");
  }

  if (fatigue !== null && fatigue >= 7) parts.push("fadiga relevante");

  const base = `Ao longo de ${daysLogged} dia${daysLogged > 1 ? "s" : ""} registrado${daysLogged > 1 ? "s" : ""}`;

  if (parts.length === 0) return `${base}, seus sintomas ficaram dentro do esperado.`;
  if (parts.length === 1) return `${base}, você percebeu ${parts[0]}.`;

  const last = parts.pop();
  return `${base}, você percebeu ${parts.join(", ")} e ${last}.`;
}

/** AI-ready stub. Guardrails: sem diagnóstico, linguagem observacional, sem alarmes. */
export async function futureGenerateWeeklyNarrative(
  _insights: WeeklyInsights,
): Promise<string> {
  throw new Error("futureGenerateWeeklyNarrative: not yet implemented — requires LLM integration approval");
}
