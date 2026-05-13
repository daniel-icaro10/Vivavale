import type { TelemetryEvent } from "../types/events";
import type { FieldMetricState } from "../types/metrics";
import type { StructuredNarrativeFieldName } from "../../structured/types/structuredNarrative";

const state: FieldMetricState = {
  opening: { ai: 0, fallback: 0 },
  trend: { ai: 0, fallback: 0 },
  reflection: { ai: 0, fallback: 0 },
  closing: { ai: 0, fallback: 0 },
};

const ALL_FIELDS: StructuredNarrativeFieldName[] = ["opening", "trend", "reflection", "closing"];

export function updateFieldMetrics(event: TelemetryEvent): void {
  if (event.type !== "generation_completed") return;

  const fieldsFromAI = Math.min(event.fieldsFromAI, ALL_FIELDS.length);
  const fieldsFallback = Math.min(event.fieldsFallback, ALL_FIELDS.length);

  // Distributes counts proportionally — exact per-field tracking requires
  // field-level events which are emitted separately via field_validation_failed.
  // Here we record aggregate AI vs fallback at the generation level.
  for (let i = 0; i < fieldsFromAI; i++) {
    const field = ALL_FIELDS[i];
    if (field) state[field].ai++;
  }
  for (let i = fieldsFromAI; i < fieldsFromAI + fieldsFallback; i++) {
    const field = ALL_FIELDS[i];
    if (field) state[field].fallback++;
  }
}

export function recordFieldResult(
  field: StructuredNarrativeFieldName,
  source: "ai" | "fallback",
): void {
  state[field][source]++;
}

export function getFieldMetrics(): Readonly<FieldMetricState> {
  return {
    opening: { ...state.opening },
    trend: { ...state.trend },
    reflection: { ...state.reflection },
    closing: { ...state.closing },
  };
}

export function resetFieldMetrics(): void {
  for (const field of ALL_FIELDS) {
    state[field].ai = 0;
    state[field].fallback = 0;
  }
}
