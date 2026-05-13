import { countMatches } from "../utils/sentenceAnalysis";

const BASE = 80;
const BAD_PENALTY = 18;
const GOOD_BONUS = 4;

/** Tom de coach motivacional — deve soar como pessoa, não como guru. */
const COACH_PATTERNS: readonly RegExp[] = [
  /\bacredite\b/i,
  /\bvoc[eê] consegue\b/i,
  /\bsupere\b/i,
  /\bvença\b/i,
  /\bpersevere\b/i,
  /\btransforme\b/i,
  /\bpoder[aá] conquistar\b/i,
  /\bestrat[eé]gia de vida\b/i,
];

/** Simulação de terapeuta — produto não é psicológico. */
const THERAPIST_PATTERNS: readonly RegExp[] = [
  /como voc[eê] se sente sobre isso/i,
  /precisa processar\b/i,
  /internaliz[ae]\b/i,
  /\btrauma\b/i,
  /sa[uú]de emocional\b/i,
  /bem-estar emocional\b/i,
  /equil[ií]brio emocional\b/i,
];

/** Linguagem médica ou autoritária. */
const AUTHORITATIVE_PATTERNS: readonly RegExp[] = [
  /\bvoc[eê] deve\b/i,
  /\b[eé] obrigat[oó]rio\b/i,
  /\bprecisa fazer\b/i,
  /\btem que\b/i,
  /\bé imperativo\b/i,
  /\bé essencial que voc[eê]\b/i,
  /procure um m[eé]dico\b/i,
  /\bconsulte\b/i,
];

/** Tom gentil e observacional — sinaliza narrativa adequada. */
const GENTLE_PATTERNS: readonly RegExp[] = [
  /\btalvez\b/i,
  /\bsuavemente\b/i,
  /\bleve\b/i,
  /\bacolhedor\b/i,
  /vale observar\b/i,
  /pode ajudar perceber\b/i,
  /\bregistrou\b/i,
  /ao seu tempo\b/i,
];

/**
 * Avalia adequação do tom emocional e ausência de padrões problemáticos.
 * Score 0–100. Mínimo aceitável: 75.
 */
export function toneScore(text: string): { score: number; flags: string[] } {
  let score = BASE;
  const flags: string[] = [];

  for (const re of COACH_PATTERNS) {
    const hits = countMatches(re, text);
    if (hits > 0) {
      score -= BAD_PENALTY * hits;
      flags.push(`coach_tone: ${re.source}`);
    }
  }

  for (const re of THERAPIST_PATTERNS) {
    const hits = countMatches(re, text);
    if (hits > 0) {
      score -= BAD_PENALTY * hits;
      flags.push(`therapist_tone: ${re.source}`);
    }
  }

  for (const re of AUTHORITATIVE_PATTERNS) {
    const hits = countMatches(re, text);
    if (hits > 0) {
      score -= BAD_PENALTY * hits;
      flags.push(`authoritative_tone: ${re.source}`);
    }
  }

  for (const re of GENTLE_PATTERNS) {
    if (re.test(text)) {
      score += GOOD_BONUS;
    }
  }

  return { score: Math.max(0, Math.min(100, score)), flags };
}
