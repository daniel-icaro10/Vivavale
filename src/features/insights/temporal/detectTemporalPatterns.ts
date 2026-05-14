import type { TemporalContext, TemporalPattern } from "./types";
import { PATTERN_POOL } from "./patternPool";

function pick(pool: string[], seed: number): string {
  return pool[seed % pool.length];
}

export function detectTemporalPatterns(ctx: TemporalContext): TemporalPattern {
  const { totalLogs, daysThisWeek, daysSinceLastLog, longitudinalState } = ctx;
  const seed = Math.floor(totalLogs / 5) + daysThisWeek;

  // Padrão suficiente de histórico para observações temporais
  if (totalLogs < 6) return { thread: null };

  // Retorno com histórico → ecos do passado
  if (
    longitudinalState === "returning" &&
    totalLogs >= 8 &&
    daysSinceLastLog !== null &&
    daysSinceLastLog >= 4
  ) {
    return { thread: pick(PATTERN_POOL.returning_pattern, seed) };
  }

  // Fragmentado mas com contexto → retorno de padrões
  if (longitudinalState === "fragmented" && totalLogs >= 8) {
    return { thread: pick(PATTERN_POOL.fragmented_return, seed) };
  }

  // Consistente com profundidade → recorrências visíveis
  if (longitudinalState === "consistent" && totalLogs >= 9) {
    return { thread: pick(PATTERN_POOL.recurring_presence, seed) };
  }

  // Estável com histórico → ecos de períodos anteriores
  if (longitudinalState === "stable" && totalLogs >= 8 && daysThisWeek >= 3) {
    return { thread: pick(PATTERN_POOL.echo_of_past, seed) };
  }

  // Contexto profundo (proxy máximo) → continuidade histórica
  if (totalLogs >= 10 && longitudinalState !== "neutral" && daysThisWeek >= 2) {
    return { thread: pick(PATTERN_POOL.deep_continuity, seed) };
  }

  return { thread: null };
}
