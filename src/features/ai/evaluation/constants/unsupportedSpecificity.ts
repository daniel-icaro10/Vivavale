/**
 * Padrões que indicam especificidade não suportada pelo payload enviado à IA.
 *
 * O NarrativeContext contém APENAS: daysLogged, médias numéricas, tendências e
 * labels de correlação — sem timestamps, dias específicos ou eventos pontuais.
 *
 * Qualquer match aqui → rejeição automática (specificity = 0).
 */
export const UNSUPPORTED_SPECIFICITY_PATTERNS: readonly RegExp[] = [
  // Dias da semana com predicado
  /(segunda|ter[cç]a|quarta|quinta|sexta|s[aá]bado|domingo)(-feira)? (pareceu|foi|estava|ficou|melhorou|piorou)/i,

  // Períodos do dia com evento
  /(manh[aã]|tarde|noite) (melhorou|piorou|foi|estava|pareceu|ficou)/i,

  // Causalidade direta inventada
  /(a dor causou|o sono afetou diretamente|fadiga causou|humor causou|ansiedade causou)/i,

  // Percentuais ou números inventados
  /\d+\s*%\s*(melhor|pior|maior|menor|acima|abaixo)/i,

  // Horários específicos
  /[àa]s\s*\d{1,2}h\b/i,
  /após\s*\d+\s*horas?\b/i,

  // Referências a eventos específicos não fornecidos
  /(no dia \d|em \d+ de|no dia \d{1,2})/i,

  // Afirmações sobre mudanças precisas que o modelo não sabe
  /(exatamente|precisamente|especificamente) (melhor|pior|mais (alto|baixo|forte|fraco))/i,
];
