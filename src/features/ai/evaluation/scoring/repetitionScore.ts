import type { NarrativeType } from "../../types/narrative";
import { extractFirstSentence, extractLastSentence } from "../utils/sentenceAnalysis";
import { jaccardSimilarity } from "../utils/tokenize";

/** Janela de histórico por tipo (mantida em memória de processo, sem persistência). */
const HISTORY_SIZE = 5;
const recentOpenings = new Map<NarrativeType, string[]>();
const recentClosings = new Map<NarrativeType, string[]>();

const SIMILARITY_THRESHOLD_HIGH = 0.55; // > 55% = muito similar
const SIMILARITY_THRESHOLD_MOD = 0.35;  // > 35% = moderadamente similar

const PENALTY_HIGH = 30;
const PENALTY_MOD = 15;

/**
 * Detecta repetição estrutural comparando abertura/encerramento com histórico recente.
 * Score 0–100. Mínimo aceitável: 60.
 *
 * Memória: process-level Map, sem DB, sem serialização.
 */
export function repetitionScore(
  text: string,
  type: NarrativeType,
): { score: number; flags: string[] } {
  let score = 100;
  const flags: string[] = [];

  const opening = extractFirstSentence(text);
  const closing = extractLastSentence(text);

  const prevOpenings = recentOpenings.get(type) ?? [];
  const prevClosings = recentClosings.get(type) ?? [];

  // Compara abertura com histórico
  for (const prev of prevOpenings) {
    const sim = jaccardSimilarity(opening, prev);
    if (sim > SIMILARITY_THRESHOLD_HIGH) {
      score -= PENALTY_HIGH;
      flags.push(`repetitive_opening_high (sim=${sim.toFixed(2)})`);
      break;
    } else if (sim > SIMILARITY_THRESHOLD_MOD) {
      score -= PENALTY_MOD;
      flags.push(`repetitive_opening_mod (sim=${sim.toFixed(2)})`);
      break;
    }
  }

  // Compara encerramento com histórico
  for (const prev of prevClosings) {
    const sim = jaccardSimilarity(closing, prev);
    if (sim > SIMILARITY_THRESHOLD_HIGH) {
      score -= PENALTY_HIGH;
      flags.push(`repetitive_closing_high (sim=${sim.toFixed(2)})`);
      break;
    } else if (sim > SIMILARITY_THRESHOLD_MOD) {
      score -= PENALTY_MOD;
      flags.push(`repetitive_closing_mod (sim=${sim.toFixed(2)})`);
      break;
    }
  }

  // Atualiza memória (sliding window)
  recentOpenings.set(type, [opening, ...prevOpenings].slice(0, HISTORY_SIZE));
  recentClosings.set(type, [closing, ...prevClosings].slice(0, HISTORY_SIZE));

  return { score: Math.max(0, Math.min(100, score)), flags };
}

/** Limpa o histórico de repetição (útil para testes ou reset manual). */
export function clearRepetitionHistory(): void {
  recentOpenings.clear();
  recentClosings.clear();
}
