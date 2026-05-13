/**
 * Padrões estruturais que sinalizam narrativa gerada mecanicamente.
 * Detectados no início de frases ou como estruturas dominantes.
 */
export const ROBOTIC_OPENING_PATTERNS: readonly RegExp[] = [
  /^os dados\b/i,
  /^a an[aá]lise\b/i,
  /^os resultados\b/i,
  /^conforme\b/i,
  /^de acordo com\b/i,
  /^segundo os dados\b/i,
  /^com base nos dados\b/i,
  /^o sistema\b/i,
];

/**
 * Padrões de estrutura repetitiva dentro de uma única narrativa.
 * Ex: todas as frases começando com "Ao longo" ou "Os registros".
 */
export const REPETITIVE_STRUCTURE_PATTERNS: readonly RegExp[] = [
  /ao longo/gi,
  /os registros/gi,
  /voc[eê] registrou/gi,
  /parece haver/gi,
];

/**
 * Padrões que indicam mistura de idioma (modelo respondeu em inglês parcialmente).
 */
export const LANGUAGE_MIX_PATTERNS: readonly RegExp[] = [
  /\byour\b/i,
  /\bthis (shows|indicates|suggests|means)\b/i,
  /\byou have\b/i,
  /\bthe data\b/i,
  /\bclearly\b/i,
];
