import type { SymptomAnswers, ComputedScores } from "../types";

const FREQUENCY_WEIGHT: Record<string, number> = {
  daily: 1.0,
  few_times_week: 0.75,
  weekly: 0.5,
  rarely: 0.25,
};

const DURATION_BONUS: Record<string, number> = {
  less_week: 0,
  weeks: 10,
  months: 20,
  over_year: 30,
};

export function computeScores(a: SymptomAnswers): ComputedScores {
  const fw = FREQUENCY_WEIGHT[a.frequency] ?? 0.5;
  const db = DURATION_BONUS[a.symptom_duration] ?? 0;

  // pain_score: intensity × frequency + duration bonus
  const pain_score = Math.min(100, Math.round(a.intensity * 7.5 * fw + db));

  // fatigue_score: inverse of energy (1=exhausto → 100)
  const fatigue_score = Math.min(100, Math.round((11 - a.energy_level) * 10));

  // sleep_score: inverse of sleep quality
  const sleep_score = Math.min(100, Math.round((11 - a.sleep_quality) * 10));

  // mood_score: inverse of mood level
  const mood_score = Math.min(100, Math.round((11 - a.mood_level) * 10));

  // impact_score: daily_impact 1–5 → 0–100
  const impact_score = Math.round((a.daily_impact - 1) * 25);

  // consistency_score: ponderação reflete que dor e fadiga são centrais para o produto
  const consistency_score = Math.round(
    pain_score * 0.28 +
      fatigue_score * 0.22 +
      sleep_score * 0.18 +
      mood_score * 0.14 +
      impact_score * 0.18,
  );

  return {
    pain_score,
    fatigue_score,
    sleep_score,
    mood_score,
    impact_score,
    consistency_score,
  };
}
