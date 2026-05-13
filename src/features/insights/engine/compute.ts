import type { SymptomAnswers, InsightsResult } from "../types";
import { computeScores } from "../scoring/scores";
import { generateInsights } from "../rules/patterns";

/**
 * Ponto de entrada principal do engine.
 * Recebe as respostas brutas e devolve scores + insights computados.
 * Função pura — sem efeitos colaterais, fácil de testar.
 */
export function computeInsights(answers: SymptomAnswers): InsightsResult {
  const scores = computeScores(answers);
  const insights = generateInsights(answers, scores);
  return { answers, scores, insights };
}
