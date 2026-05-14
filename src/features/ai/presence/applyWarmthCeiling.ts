// Aplica teto de "calor" ao texto gerado por IA.
// Substitui ou remove palavras excessivamente calorosas que soam artificiais.
// O VivaLeve deve ser observacional, não entusiasmado.

const WARMTH_REPLACEMENTS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\bincrível\b/gi,          replacement: "significativo" },
  { pattern: /\bextraordinário\b/gi,    replacement: "notável" },
  { pattern: /\bmaravilhoso\b/gi,       replacement: "interessante" },
  { pattern: /\bfantástico\b/gi,        replacement: "relevante" },
  { pattern: /\bparabéns\b/gi,          replacement: "" },
  { pattern: /\bmuito bem\b/gi,         replacement: "" },
  { pattern: /\bexcelente\b/gi,         replacement: "" },
  { pattern: /\bótimo trabalho\b/gi,    replacement: "" },
  { pattern: /\bvocê conseguiu\b/gi,    replacement: "" },
  { pattern: /!+/g,                     replacement: "." }, // transforma exclamações em ponto
];

/**
 * Remove ou suaviza linguagem excessivamente positiva do texto da IA.
 * Resultado: tom mais calmo e observacional.
 */
export function applyWarmthCeiling(text: string): string {
  let result = text;

  for (const { pattern, replacement } of WARMTH_REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }

  // Limpar espaços duplos criados por remoções
  result = result.replace(/\s{2,}/g, " ").trim();

  // Remover frases que ficaram vazias após remoções
  result = result
    .split(".")
    .map((s) => s.trim())
    .filter((s) => s.length > 2)
    .join(". ");

  if (result && !result.endsWith(".")) result += ".";

  return result;
}
