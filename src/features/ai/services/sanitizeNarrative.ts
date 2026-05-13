/** Remove artefatos comuns de saída LLM: aspas externas, markdown, tags HTML. */
export function sanitizeNarrative(raw: string): string {
  return raw
    .trim()
    // Remove aspas que o modelo às vezes adiciona na resposta inteira
    .replace(/^["']|["']$/g, "")
    // Remove negrito/itálico markdown
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")
    // Remove tags HTML simples (segurança extra)
    .replace(/<[^>]*>/g, "")
    // Colapsa múltiplas quebras de linha em uma
    .replace(/\n{2,}/g, " ")
    // Remove quebras de linha simples (resposta deve ser parágrafo único)
    .replace(/\n/g, " ")
    // Colapsa espaços múltiplos
    .replace(/  +/g, " ")
    .trim();
}
