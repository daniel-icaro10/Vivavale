// Temporal silence system — determina quando o app deve permanecer em silêncio.
// "Silêncio" = não exibir ecos, reflexões, discoveries ou insights longitudinais.
// Funciona como última camada antes de renderizar conteúdo interpretativo.

import type { CognitiveLoad } from "@/features/ux/cognitive/detectCognitiveLoad";
import type { LongitudinalState } from "@/features/insights/utils/getLongitudinalSignals";

export interface SilenceContext {
  cognitiveLoad:    CognitiveLoad;
  longitudinalState: LongitudinalState;
  daysSinceLastLog: number | null;
  daysThisWeek:     number;
  totalLogs:        number;
}

/**
 * Retorna true quando o app deve permanecer em silêncio:
 * sem ecos, sem reflexões, sem discoveries.
 *
 * A ideia central: menos é mais quando o usuário está frágil,
 * retornando ou sem histórico suficiente.
 */
export function shouldBeSilent(ctx: SilenceContext): boolean {
  const { cognitiveLoad, longitudinalState, daysSinceLastLog, daysThisWeek, totalLogs } = ctx;

  // Estados fragile/recovering: silêncio total de insights
  if (cognitiveLoad === "fragile" || cognitiveLoad === "recovering") return true;

  // Histórico insuficiente
  if (totalLogs < 5) return true;

  // Retorno fresco: primeiro dia de volta, dar espaço para respirar
  if (daysSinceLastLog !== null && daysSinceLastLog >= 7 && daysThisWeek <= 1) return true;

  // Estado "neutral" sem atividade recente
  if (longitudinalState === "neutral" && daysThisWeek < 2) return true;

  return false;
}

/**
 * Retorna a razão do silêncio para debugging/logging (não exibida ao usuário).
 */
export function getSilenceReason(ctx: SilenceContext): string | null {
  if (!shouldBeSilent(ctx)) return null;

  if (ctx.cognitiveLoad === "recovering") return "recovering_state";
  if (ctx.cognitiveLoad === "fragile")    return "fragile_state";
  if (ctx.totalLogs < 5)                 return "insufficient_history";
  if (ctx.daysSinceLastLog !== null && ctx.daysSinceLastLog >= 7 && ctx.daysThisWeek <= 1) {
    return "fresh_return";
  }
  return "low_activity";
}
