import type { MainSymptom, Frequency, Duration, InsightSeverity } from "./types";

export const SYMPTOM_LABELS: Record<MainSymptom, string> = {
  pain: "Dor física",
  fatigue: "Fadiga ou cansaço",
  anxiety: "Ansiedade",
  sleep: "Dificuldade para dormir",
  mood: "Dor emocional ou tristeza",
  other: "Outro sintoma",
};

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  daily: "Todos os dias",
  few_times_week: "Algumas vezes por semana",
  weekly: "Uma vez por semana",
  rarely: "Raramente",
};

export const DURATION_LABELS: Record<Duration, string> = {
  less_week: "Menos de uma semana",
  weeks: "Algumas semanas",
  months: "Alguns meses",
  over_year: "Mais de um ano",
};

export const IMPACT_LABELS: Record<number, string> = {
  1: "Praticamente nada",
  2: "Um pouco",
  3: "Moderadamente",
  4: "Bastante",
  5: "Muito intensamente",
};

export const OVERALL_LEVEL_HEADING: Record<InsightSeverity, string> = {
  low: "Sinais leves observados",
  moderate: "Padrões moderados identificados",
  notable: "Padrões consistentes encontrados",
};

export const OVERALL_LEVEL_SUMMARY: Record<InsightSeverity, string> = {
  low:
    "Você mencionou alguns sintomas de intensidade leve. Vale continuar observando como você se sente ao longo do tempo.",
  moderate:
    "Identificamos alguns padrões nos sintomas que você descreveu. Prestar atenção nesses sinais pode contribuir para o seu bem-estar.",
  notable:
    "Seus sintomas formam um padrão consistente em diferentes áreas. Recomendamos acompanhar esses sinais de perto e, se necessário, conversar com um profissional de saúde.",
};

// Número máximo de insights exibidos ao usuário
export const MAX_INSIGHTS_DISPLAYED = 4;
