export type StructuredNarrativeFieldName = "opening" | "trend" | "reflection" | "closing";

/** JSON retornado pela IA — todos os campos são strings simples, sem markdown. */
export interface StructuredNarrative {
  opening: string;
  trend: string;
  reflection: string;
  closing: string;
}

/** Resultado por campo após parse + validação + fallback. */
export interface FieldResult {
  value: string;
  /** true = campo veio da IA e passou validação; false = fallback determinístico. */
  isAI: boolean;
}

/** Resultado completo do pipeline estruturado. */
export interface StructuredNarrativeResult {
  fields: Record<StructuredNarrativeFieldName, FieldResult>;
  /** true se pelo menos um campo é AI. */
  anyAI: boolean;
  /** true se algum campo usou fallback enquanto outros são AI. */
  hadPartialFallback: boolean;
}

export const STRUCTURED_FIELDS: readonly StructuredNarrativeFieldName[] = [
  "opening",
  "trend",
  "reflection",
  "closing",
] as const;
