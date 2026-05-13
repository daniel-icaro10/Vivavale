export type MainSymptom = "pain" | "fatigue" | "anxiety" | "sleep" | "mood" | "other";
export type Frequency = "daily" | "few_times_week" | "weekly" | "rarely";
export type Duration = "less_week" | "weeks" | "months" | "over_year";
export type InsightSeverity = "low" | "moderate" | "notable";
export type InsightArea = "pain" | "fatigue" | "sleep" | "mood" | "impact" | "pattern";

export interface SymptomAnswers {
  main_symptoms: MainSymptom[];
  intensity: number;          // 1–10
  frequency: Frequency;
  sleep_quality: number;      // 1–10 (1 = muito ruim)
  energy_level: number;       // 1–10 (1 = sem energia)
  mood_level: number;         // 1–10 (1 = muito baixo)
  symptom_duration: Duration;
  daily_impact: number;       // 1–5
  has_medications: boolean;
  medications_text?: string;
}

export interface ComputedScores {
  pain_score: number;         // 0–100
  fatigue_score: number;      // 0–100
  sleep_score: number;        // 0–100
  mood_score: number;         // 0–100
  impact_score: number;       // 0–100
  consistency_score: number;  // 0–100 (média ponderada)
}

export interface Insight {
  id: string;
  title: string;
  body: string;
  severity: InsightSeverity;
  area: InsightArea;
}

export interface ComputedInsights {
  insights: Insight[];
  overall_level: InsightSeverity;
  summary: string;
  recommendations: string[];
}

export interface InsightsResult {
  answers: SymptomAnswers;
  scores: ComputedScores;
  insights: ComputedInsights;
}
