/** Extrai a primeira sentença do texto (até o primeiro .!?). */
export function extractFirstSentence(text: string): string {
  const match = /^[^.!?]+[.!?]/.exec(text);
  return match ? match[0].trim() : text.trim();
}

/** Extrai a última sentença não-vazia do texto. */
export function extractLastSentence(text: string): string {
  const parts = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return parts[parts.length - 1] ?? text.trim();
}

/** Conta ocorrências de um RegExp num texto. */
export function countMatches(re: RegExp, text: string): number {
  const global = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
  return (text.match(global) ?? []).length;
}

/** Conta quantas frases começam com o mesmo padrão (abertura duplicada). */
export function countDuplicateOpenings(text: string): number {
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);

  const openings = sentences.map((s) => s.slice(0, 12).toLowerCase());
  const seen = new Set<string>();
  let duplicates = 0;
  for (const o of openings) {
    if (seen.has(o)) duplicates++;
    seen.add(o);
  }
  return duplicates;
}
