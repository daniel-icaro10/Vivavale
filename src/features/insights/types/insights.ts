import type { DailyLog } from "@/types/app";

export type TrendDirection = "improving" | "stable" | "worsening" | "insufficient_data";

export interface DayGroup {
  date: string;      // "YYYY-MM-DD"
  label: string;     // "Terça-feira, 13 de maio"
  logs: DailyLog[];
}

export interface CorrelationInsight {
  dimensionA: string;
  dimensionB: string;
  label: string;
  body: string;
  strength: "strong" | "moderate";
}

export interface TemporalInsight {
  dimension: string;
  label: string;
  trend: TrendDirection;
  currentAvg: number;
  previousAvg: number;
  body: string;
}

export interface WeeklyInsights {
  weekStart: string;  // "YYYY-MM-DD"
  weekEnd: string;
  avgPain: number | null;
  avgFatigue: number | null;
  avgSleep: number | null;
  avgMood: number | null;
  avgAnxiety: number | null;
  daysLogged: number;
  trends: TemporalInsight[];
  correlations: CorrelationInsight[];
  summary: string;
}
