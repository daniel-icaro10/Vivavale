// Valida o ritmo de frase de texto gerado por IA.
// Detecta padrões over-formal, over-articulated ou repetitivos.

export interface RhythmValidation {
  isValid: boolean;
  /** Lista de padrões problemáticos encontrados. */
  warnings: string[];
}

const OVER_FORMAL_MARKERS = [
  /\bportanto\b/gi,
  /\bcontudo\b/gi,
  /\bno entanto\b/gi,
  /\bsendo assim\b/gi,
  /\bpodemos observar\b/gi,
  /\bcomo podemos ver\b/gi,
  /\bé importante notar\b/gi,
  /\bé fundamental\b/gi,
];

const OVER_ARTICULATED_PATTERNS = [
  /,.*,.*,.*,/,              // 3+ vírgulas em sequência
  /\b(que|e|mas|pois) (que|e|mas|pois)\b/gi,  // conectores duplos
];

const MEDICAL_ASSERTION_PATTERNS = [
  /seu (progresso|estado|quadro|saúde)/gi,
  /você (está|parece|mostra|apresenta)/gi,
  /isso (indica|sugere|significa|mostra)/gi,
];

/**
 * Valida se o texto gerado por IA mantém ritmo natural e não-clínico.
 */
export function validateSentenceRhythm(text: string): RhythmValidation {
  const warnings: string[] = [];

  for (const pattern of OVER_FORMAL_MARKERS) {
    if (pattern.test(text)) {
      warnings.push(`Marcador formal detectado: ${pattern.source}`);
    }
  }

  for (const pattern of OVER_ARTICULATED_PATTERNS) {
    if (pattern.test(text)) {
      warnings.push(`Sobre-articulação: ${pattern.source}`);
    }
  }

  for (const pattern of MEDICAL_ASSERTION_PATTERNS) {
    if (pattern.test(text)) {
      warnings.push(`Assertiva clínica: ${pattern.source}`);
    }
  }

  // Frases muito longas (>120 chars) tendem a ser over-explained
  const sentences = text.split(/[.!?]+/).filter(Boolean);
  const tooLong = sentences.filter((s) => s.trim().length > 120);
  if (tooLong.length > 0) {
    warnings.push(`${tooLong.length} frase(s) excedem 120 caracteres.`);
  }

  return { isValid: warnings.length === 0, warnings };
}
