import type { StructuredNarrative } from "../types/structuredNarrative";
import { STRUCTURED_FIELDS } from "../types/structuredNarrative";

/** Type guard: verifica se obj tem todos os campos obrigatórios como strings não-vazias. */
export function isStructuredNarrative(obj: unknown): obj is StructuredNarrative {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return false;

  const record = obj as Record<string, unknown>;

  return STRUCTURED_FIELDS.every(
    (field) => typeof record[field] === "string" && (record[field] as string).length > 0,
  );
}
