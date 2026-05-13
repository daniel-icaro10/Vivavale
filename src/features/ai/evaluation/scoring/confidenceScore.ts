import { OVERCONFIDENT_TERMS, HEDGING_TERMS } from "../constants/overconfidentTerms";
import { countMatches } from "../utils/sentenceAnalysis";

const BASE = 80;
const OVERCONFIDENT_PENALTY = 15;
const HEDGING_BONUS = 4;

/**
 * Avalia nível de hedging apropriado (linguagem de incerteza).
 * Score alto = linguagem bem calibrada (não assertiva demais).
 * Score 0–100. Mínimo aceitável: 70.
 */
export function confidenceScore(text: string): { score: number; flags: string[] } {
  let score = BASE;
  const flags: string[] = [];

  for (const re of OVERCONFIDENT_TERMS) {
    const hits = countMatches(re, text);
    if (hits > 0) {
      score -= OVERCONFIDENT_PENALTY * hits;
      flags.push(`overconfident: ${re.source}`);
    }
  }

  for (const re of HEDGING_TERMS) {
    if (re.test(text)) {
      score += HEDGING_BONUS;
    }
  }

  return { score: Math.max(0, Math.min(100, score)), flags };
}
