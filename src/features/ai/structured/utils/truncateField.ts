/**
 * Trunca um campo ao limite de caracteres respeitando fronteiras de palavras.
 * Adiciona "…" se truncado.
 */
export function truncateField(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;

  const truncated = text.slice(0, maxChars);
  const lastSpace = truncated.lastIndexOf(" ");

  // Se o último espaço está na segunda metade do texto, corta por palavra
  const cutPoint = lastSpace > maxChars * 0.6 ? lastSpace : maxChars;
  return truncated.slice(0, cutPoint).trimEnd() + "…";
}
