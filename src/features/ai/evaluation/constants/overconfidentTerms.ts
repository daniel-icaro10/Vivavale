/**
 * Termos que sinalizam excesso de certeza ou assertividade.
 * Cada match penaliza o confidenceScore.
 */
export const OVERCONFIDENT_TERMS: readonly RegExp[] = [
  /\bclaramente\b/i,
  /\bdefinitivamente\b/i,
  /isso (prova|demonstra|confirma)\b/i,
  /isso significa\b/i,
  /voc[eê] estava (pior|melhor)\b/i,
  /\bcertamente\b/i,
  /com certeza\b/i,
  /[eé] certo que\b/i,
  /\bcomprovado\b/i,
  /sem d[uú]vida\b/i,
  /[eé] evidente\b/i,
  /\bindiscutivelmente\b/i,
  /\bprovadamente\b/i,
  /\bnecessariamente\b/i,
  /\bindubitavelmente\b/i,
];

/**
 * Termos de hedging apropriado.
 * Cada match recompensa o confidenceScore.
 */
export const HEDGING_TERMS: readonly RegExp[] = [
  /pode (indicar|acompanhar|estar|ter|ser)/i,
  /parece (acompanhar|haver|estar|ser)/i,
  /[àa]s vezes\b/i,
  /em alguns\b/i,
  /\btalvez\b/i,
  /\bpossivelmente\b/i,
  /tende a\b/i,
  /pode ter acompanhado/i,
  /\bgeralmente\b/i,
  /com frequ[eê]ncia\b/i,
];
