/**
 * Remove artefatos comuns de saída LLM antes do parse JSON:
 * - Code fences: ```json ... ```
 * - Texto explicativo antes/depois do bloco JSON
 * - Espaços e quebras de linha extras
 */
export function cleanJsonResponse(raw: string): string {
  // Remove code fences (```json ... ``` ou ``` ... ```)
  const fenceStripped = raw.replace(/```(?:json)?\s*([\s\S]*?)```/gi, "$1").trim();

  // Extrai primeiro bloco JSON válido { ... }
  const jsonMatch = /\{[\s\S]*\}/.exec(fenceStripped);
  if (jsonMatch) return jsonMatch[0].trim();

  // Fallback: retorna o texto limpo (parse vai falhar se não for JSON)
  return fenceStripped;
}
