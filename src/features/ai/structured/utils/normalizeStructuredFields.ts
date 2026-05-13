/**
 * Normaliza um campo de narrativa estruturada:
 * - Remove markdown (bold/italic)
 * - Remove HTML tags
 * - Remove emojis
 * - Colapsa quebras de linha e espaços
 * - Trim
 */
export function normalizeStructuredField(text: string): string {
  return text
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")   // markdown bold/italic
    .replace(/_([^_]+)_/g, "$1")                  // markdown underscore
    .replace(/<[^>]*>/g, "")                       // HTML tags
    // Emojis: block U+1F300–U+1FFFF (supplementary multilingual plane)
    .replace(/[\u{1F300}-\u{1FFFF}]/gu, "")
    .replace(/[\u{2600}-\u{27BF}]/gu, "")          // Misc symbols
    .replace(/\n+/g, " ")                          // flatten newlines
    .replace(/\s{2,}/g, " ")                       // collapse spaces
    .trim();
}
