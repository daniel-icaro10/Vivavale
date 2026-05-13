import { COLD_TERMS, WARM_TERMS } from "../constants/coldTerms";
import {
  ROBOTIC_OPENING_PATTERNS,
  LANGUAGE_MIX_PATTERNS,
  REPETITIVE_STRUCTURE_PATTERNS,
} from "../constants/roboticPatterns";
import { countMatches } from "../utils/sentenceAnalysis";

const BASE = 70;
const COLD_PENALTY = 12;
const WARM_BONUS = 5;
const ROBOTIC_OPENING_PENALTY = 15;
const LANGUAGE_MIX_PENALTY = 25;
const REPETITIVE_STRUCTURE_PENALTY = 8;

/**
 * Avalia calor humano e naturalidade da narrativa.
 * Score 0–100. Mínimo aceitável: 65.
 */
export function warmthScore(text: string): { score: number; flags: string[] } {
  let score = BASE;
  const flags: string[] = [];

  for (const re of COLD_TERMS) {
    const hits = countMatches(re, text);
    if (hits > 0) {
      score -= COLD_PENALTY * hits;
      flags.push(`cold_term: ${re.source}`);
    }
  }

  for (const re of WARM_TERMS) {
    if (re.test(text)) {
      score += WARM_BONUS;
    }
  }

  // Penaliza aberturas robóticas no início do texto
  for (const re of ROBOTIC_OPENING_PATTERNS) {
    if (re.test(text.trimStart())) {
      score -= ROBOTIC_OPENING_PENALTY;
      flags.push(`robotic_opening: ${re.source}`);
      break; // penalizar apenas uma abertura
    }
  }

  // Penaliza estrutura repetitiva interna
  for (const re of REPETITIVE_STRUCTURE_PATTERNS) {
    const hits = countMatches(re, text);
    if (hits >= 2) {
      score -= REPETITIVE_STRUCTURE_PENALTY;
      flags.push(`repetitive_structure: ${re.source}`);
    }
  }

  // Penaliza mix de idioma
  for (const re of LANGUAGE_MIX_PATTERNS) {
    if (re.test(text)) {
      score -= LANGUAGE_MIX_PENALTY;
      flags.push(`language_mix: ${re.source}`);
      break;
    }
  }

  return { score: Math.max(0, Math.min(100, score)), flags };
}
