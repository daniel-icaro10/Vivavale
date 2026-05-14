// Pontua o nível de sutileza emocional de um texto gerado por IA.
// Score 0..1: 0 = sem sutileza (muito explícito/entusiasmado), 1 = máxima sutileza.

const SUBTLETY_PENALTY_PATTERNS: Array<{ pattern: RegExp; penalty: number }> = [
  { pattern: /!/g,                                   penalty: 0.15 },
  { pattern: /\b(incrível|maravilhoso|extraordinário)\b/gi, penalty: 0.10 },
  { pattern: /\b(sempre|nunca|jamais|certamente)\b/gi,       penalty: 0.08 },
  { pattern: /\bvocê (está|é|parece|deveria)\b/gi,           penalty: 0.12 },
  { pattern: /\b(seu progresso|sua jornada|seu caminho)\b/gi,penalty: 0.10 },
  { pattern: /\bparabéns\b/gi,                               penalty: 0.20 },
  { pattern: /\bótimo\b/gi,                                  penalty: 0.05 },
];

const SUBTLETY_REWARD_PATTERNS: Array<{ pattern: RegExp; reward: number }> = [
  { pattern: /\bparece\b/gi,              reward: 0.08 },  // linguagem observacional
  { pattern: /\bpode ser\b/gi,            reward: 0.06 },  // incerteza saudável
  { pattern: /\bàs vezes\b/gi,            reward: 0.05 },  // não absoluto
  { pattern: /\balguns\b/gi,              reward: 0.04 },
];

/**
 * Retorna score de sutileza emocional: 0 (explícito) → 1 (sutil).
 * Score ideal para o VivaLeve: ≥ 0.70.
 */
export function scoreEmotionalSubtlety(text: string): number {
  let score = 1.0;

  for (const { pattern, penalty } of SUBTLETY_PENALTY_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) score -= penalty * Math.min(matches.length, 2);
  }

  for (const { reward } of SUBTLETY_REWARD_PATTERNS) {
    // Pequenas recompensas por linguagem observacional (limitado)
    score = Math.min(1.0, score + reward * 0.5);
  }

  return Math.max(0, Math.round(score * 100) / 100);
}

/** Verdadeiro se o texto passa no limiar de sutileza do VivaLeve. */
export function passesSubtletyThreshold(text: string, threshold = 0.70): boolean {
  return scoreEmotionalSubtlety(text) >= threshold;
}
