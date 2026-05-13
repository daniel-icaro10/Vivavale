import { UNSUPPORTED_SPECIFICITY_PATTERNS } from "../constants/unsupportedSpecificity";

/**
 * Detecta especificidade não suportada pelo payload enviado à IA.
 * Qualquer match = score 0 (rejeição automática).
 * Score 0–100. Mínimo aceitável: 85.
 */
export function specificityScore(text: string): { score: number; flags: string[] } {
  const flags: string[] = [];

  for (const re of UNSUPPORTED_SPECIFICITY_PATTERNS) {
    if (re.test(text)) {
      flags.push(`unsupported_specificity: ${re.source}`);
      return { score: 0, flags };
    }
  }

  return { score: 100, flags };
}
