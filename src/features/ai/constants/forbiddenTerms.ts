/**
 * Termos proibidos na saída da IA.
 * Se qualquer um aparecer → descartar resposta → usar fallback determinístico.
 * Regex case-insensitive, word-boundary onde possível.
 */
export const FORBIDDEN_TERMS: readonly RegExp[] = [
  // Diagnóstico e doença
  /diagn[oó]stico/i,
  /doen[çc]a/i,
  /patologia/i,
  /condição confirmada/i,

  // Condições nomeadas (menção específica de doenças)
  /fibromialgia/i,
  /depress[aã]o/i,
  /ansiedade generalizada/i,
  /s[ií]ndrome/i,
  /transtorno/i,
  /inflama[çc][aã]o/i,
  /artrite/i,
  /autoimune/i,
  /neurol[oó]gico/i,
  /psiqui[aá]trico/i,
  /dist[uú]rbio/i,
  /les[aã]o/i,
  /disfun[çc][aã]o/i,

  // Causalidade assertiva
  /voc[eê] tem\b/i,
  /voc[eê] sofre\b/i,
  /isso indica\b/i,
  /isso significa\b/i,
  /sinais de\b/i,
  /provavelmente [eé]\b/i,
  /quadro cl[ií]nico/i,
  /crise\b/i,

  // Urgência / alarmismo
  /procure um m[eé]dico imediatamente/i,
  /emergência/i,
  /urgente/i,
  /perigo/i,

  // Medicamentos (mencionar ou recomendar)
  /tomar [a-z]+mg/i,
  /dose\b/i,
  /prescri[çc][aã]o/i,
  /remédio\b/i,
  /medicamento\b/i,
];

/** Retorna o primeiro termo proibido encontrado, ou null se nenhum. */
export function findForbiddenTerm(text: string): string | null {
  for (const re of FORBIDDEN_TERMS) {
    const match = re.exec(text);
    if (match) return match[0];
  }
  return null;
}
