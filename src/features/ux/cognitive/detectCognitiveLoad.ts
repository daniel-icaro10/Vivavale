// Cognitive load detection — mapeia sinais comportamentais para um estado de carga cognitiva.
// Governa densidade da UI, motion, e frequência de insights.
// Inputs são os mesmos já calculados pelo dashboard e layout.

import type { LongitudinalState } from "@/features/insights/utils/getLongitudinalSignals";

export type CognitiveLoad = "calm" | "reduced" | "fragile" | "recovering";

export interface CognitiveLoadInput {
  daysSinceLastLog: number | null;
  daysThisWeek: number;
  totalLogs: number;
  longitudinalState: LongitudinalState;
}

/**
 * Retorna o estado de carga cognitiva estimado do usuário.
 *
 * recovering → ausência longa (≥14d) ou estado "silent"
 * fragile    → ritmo fragmentado ou ausência moderada (7–13d)
 * reduced    → retorno recente (4–6d) ou estado "returning"
 * calm       → ativo, ritmo regular
 */
export function detectCognitiveLoad(input: CognitiveLoadInput): CognitiveLoad {
  const { daysSinceLastLog, daysThisWeek: _daysThisWeek, totalLogs, longitudinalState } = input;

  // Sem histórico suficiente — trata como neutro/calm
  if (totalLogs < 3) return "calm";

  // Ausência muito longa
  if (longitudinalState === "silent" || (daysSinceLastLog !== null && daysSinceLastLog >= 14)) {
    return "recovering";
  }

  // Padrão fragmentado com histórico — usuário com dificuldade de continuidade
  if (
    longitudinalState === "fragmented" ||
    (daysSinceLastLog !== null && daysSinceLastLog >= 7 && totalLogs >= 5)
  ) {
    return "fragile";
  }

  // Retornando após pausa moderada
  if (longitudinalState === "returning" || (daysSinceLastLog !== null && daysSinceLastLog >= 4)) {
    return "reduced";
  }

  // Ativo, ritmo saudável
  return "calm";
}
