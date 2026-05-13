import type { SymptomAnswers, ComputedScores, Insight, ComputedInsights, InsightSeverity } from "../types";
import { OVERALL_LEVEL_SUMMARY, MAX_INSIGHTS_DISPLAYED } from "../constants";

// ============================================================
// Cada regra retorna um Insight ou null.
// Ordenadas por relevância clínica — as primeiras têm prioridade.
// Linguagem: observacional, nunca diagnóstica.
// ============================================================

type RuleFn = (a: SymptomAnswers, s: ComputedScores) => Insight | null;

const rules: RuleFn[] = [
  // Dor de alta intensidade com frequência elevada
  (a, s) => {
    if (s.pain_score < 65) return null;
    return {
      id: "pain_high",
      area: "pain",
      severity: s.pain_score >= 80 ? "notable" : "moderate",
      title: "Nível de dor significativo",
      body: "Você relatou um grau considerável de dor física. Isso pode estar afetando diferentes aspectos do seu cotidiano.",
    };
  },

  // Dor persistente (meses+)
  (a, s) => {
    if (s.pain_score < 50) return null;
    if (a.symptom_duration !== "months" && a.symptom_duration !== "over_year") return null;
    return {
      id: "pain_persistent",
      area: "pain",
      severity: "moderate",
      title: "Sintomas de dor persistentes",
      body: `Seus sintomas de dor vêm ocorrendo há ${a.symptom_duration === "over_year" ? "mais de um ano" : "alguns meses"}. A duração é um sinal importante a acompanhar.`,
    };
  },

  // Fadiga severa
  (a, s) => {
    if (s.fatigue_score < 65) return null;
    return {
      id: "fatigue_severe",
      area: "fatigue",
      severity: s.fatigue_score >= 80 ? "notable" : "moderate",
      title: "Fadiga considerável",
      body: "Você reportou um nível de energia bastante baixo. Fadiga persistente pode ter múltiplas origens e merece atenção.",
    };
  },

  // Relação sono ↔ energia
  (a, s) => {
    if (s.sleep_score < 55 || s.fatigue_score < 50) return null;
    if (s.sleep_score >= 65 && s.fatigue_score >= 65) {
      return {
        id: "sleep_fatigue_link",
        area: "sleep",
        severity: "moderate",
        title: "Possível relação sono e energia",
        body: "Há uma conexão observável entre a qualidade do seu sono e seus níveis de energia. Melhorar o sono pode impactar positivamente o cansaço.",
      };
    }
    return null;
  },

  // Sono ruim isolado
  (a, s) => {
    if (s.sleep_score < 65) return null;
    return {
      id: "poor_sleep",
      area: "sleep",
      severity: s.sleep_score >= 80 ? "notable" : "moderate",
      title: "Qualidade de sono afetada",
      body: "Você descreveu um sono com qualidade baixa. O sono reparador é fundamental para o manejo de dores crônicas e bem-estar geral.",
    };
  },

  // Estado emocional sob pressão
  (a, s) => {
    if (s.mood_score < 60) return null;
    return {
      id: "mood_concern",
      area: "mood",
      severity: s.mood_score >= 78 ? "notable" : "moderate",
      title: "Estado emocional sob pressão",
      body: "Seu humor e estado emocional podem estar sendo afetados. Isso é comum em pessoas que lidam com dores ou fadiga recorrentes.",
    };
  },

  // Dor + humor (relação bidirecional conhecida)
  (a, s) => {
    if (s.pain_score < 55 || s.mood_score < 50) return null;
    return {
      id: "pain_mood_link",
      area: "mood",
      severity: "moderate",
      title: "Conexão entre dor e humor",
      body: "A dor física e o estado emocional frequentemente se influenciam mutuamente. Cuidar de um aspecto tende a beneficiar o outro.",
    };
  },

  // Alto impacto funcional
  (a, s) => {
    if (s.impact_score < 75) return null;
    return {
      id: "high_impact",
      area: "impact",
      severity: "notable",
      title: "Impacto significativo no dia a dia",
      body: "Seus sintomas parecem estar limitando bastante suas atividades cotidianas. Isso merece atenção especial.",
    };
  },

  // Impacto funcional moderado
  (a, s) => {
    if (s.impact_score < 50 || s.impact_score >= 75) return null;
    return {
      id: "moderate_impact",
      area: "impact",
      severity: "moderate",
      title: "Algum impacto nas atividades",
      body: "Seus sintomas têm causado algum impacto na sua rotina. Vale observar se essa tendência muda ao longo do tempo.",
    };
  },

  // Múltiplos sintomas simultâneos
  (a) => {
    if (a.main_symptoms.length < 3) return null;
    return {
      id: "multi_symptom",
      area: "pattern",
      severity: "moderate",
      title: "Múltiplos sintomas simultaneamente",
      body: "Você relatou vários sintomas ao mesmo tempo. Padrões de sintomas combinados podem indicar a necessidade de avaliação mais abrangente.",
    };
  },

  // Padrão consistente entre domínios
  (_, s) => {
    if (s.consistency_score < 55) return null;
    return {
      id: "consistent_pattern",
      area: "pattern",
      severity: s.consistency_score >= 70 ? "notable" : "moderate",
      title: "Padrão consistente observado",
      body: "Seus relatos mostram um padrão coerente de sintomas em diferentes áreas — dor, energia, sono e humor. Acompanhar essa evolução pode ser valioso.",
    };
  },
];

// ============================================================
// Gera recomendações baseadas nos scores
// ============================================================

function buildRecommendations(s: ComputedScores, a: SymptomAnswers): string[] {
  const recs: string[] = [];

  if (s.sleep_score >= 55) {
    recs.push("Priorizar o sono pode ajudar na qualidade geral de vida. Rotinas regulares de descanso tendem a fazer diferença.");
  }
  if (s.mood_score >= 60) {
    recs.push("Atividades que promovam relaxamento — como caminhadas leves ou respiração — podem ajudar no estado emocional.");
  }
  if (s.fatigue_score >= 65) {
    recs.push("Respeitar os limites do corpo e alternar atividades com pausas é uma estratégia útil no manejo da fadiga.");
  }
  if (s.impact_score >= 75) {
    recs.push("Adaptar sua rotina às suas necessidades atuais — sem se cobrar — pode reduzir o impacto dos sintomas no dia a dia.");
  }
  if (a.has_medications) {
    recs.push("Compartilhar essas observações com quem acompanha sua medicação pode enriquecer o cuidado que você recebe.");
  }

  recs.push("Considere conversar com um profissional de saúde sobre o que está sentindo. Esses dados podem ser um ponto de partida útil.");

  return recs;
}

// ============================================================
// Função principal de geração de insights
// ============================================================

export function generateInsights(
  answers: SymptomAnswers,
  scores: ComputedScores,
): ComputedInsights {
  // Executa todas as regras e filtra nulls
  const allInsights = rules
    .map((rule) => rule(answers, scores))
    .filter((i): i is Insight => i !== null);

  // Prioriza "notable" → "moderate" → "low", limita ao máximo configurado
  const sorted = allInsights.sort((a, b) => {
    const order: Record<InsightSeverity, number> = { notable: 0, moderate: 1, low: 2 };
    return order[a.severity] - order[b.severity];
  });

  const insights = sorted.slice(0, MAX_INSIGHTS_DISPLAYED);

  // overall_level baseado no consistency_score
  const overall_level: InsightSeverity =
    scores.consistency_score >= 62 ? "notable"
    : scores.consistency_score >= 38 ? "moderate"
    : "low";

  const summary = OVERALL_LEVEL_SUMMARY[overall_level];
  const recommendations = buildRecommendations(scores, answers);

  return { insights, overall_level, summary, recommendations };
}
