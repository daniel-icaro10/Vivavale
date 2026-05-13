import type { StructuredNarrativeFieldName } from "../types/structuredNarrative";

/** Limite máximo de caracteres por campo. A IA deve respeitar esses limites via prompt. */
export const FIELD_LIMITS: Record<StructuredNarrativeFieldName, number> = {
  opening: 120,
  trend: 160,
  reflection: 180,
  closing: 120,
} as const;

/** Comprimento mínimo aceitável por campo (protege contra respostas vazias/triviais). */
export const FIELD_MIN_LENGTH: Record<StructuredNarrativeFieldName, number> = {
  opening: 15,
  trend: 20,
  reflection: 20,
  closing: 15,
} as const;
