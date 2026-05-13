/**
 * Termos que sinalizam linguagem clínica, robótica ou impessoal.
 * Cada match penaliza o warmthScore.
 */
export const COLD_TERMS: readonly RegExp[] = [
  /os dados indicam/i,
  /a an[aá]lise (revela|detectou|mostra|indica)/i,
  /os resultados demonstram/i,
  /conforme os dados/i,
  /estatisticamente/i,
  /progres(s[aã]o|ivo)/i,
  /m[eé]tricas?\b/i,
  /par[aâ]metros?\b/i,
  /[íi]ndice de\b/i,
  /performance\b/i,
  /an[aá]lise detectou/i,
  /os registros demonstram/i,
  /conforme (a an[aá]lise|os dados|o sistema)/i,
  /o sistema (identificou|detectou|calculou)/i,
  /processamento\b/i,
  /output\b/i,
  /algoritmo\b/i,
];

/**
 * Termos que sinalizam linguagem humana, suave e observacional.
 * Cada match recompensa o warmthScore.
 */
export const WARM_TERMS: readonly RegExp[] = [
  /\bparece\b/i,
  /ao longo\b/i,
  /em alguns (momentos?|dias?|per[ií]odos?)/i,
  /voc[eê] (pode|parece|percebeu|registrou)/i,
  /durante a semana/i,
  /\btalvez\b/i,
  /pode (ser|estar|indicar|ter)/i,
  /[àa]s vezes\b/i,
  /\bpercebeu\b/i,
  /tende a\b/i,
  /foi observado\b/i,
  /pode estar relacionado/i,
  /parece haver\b/i,
];
