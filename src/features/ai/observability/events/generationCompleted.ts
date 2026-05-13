import type { TelemetryEvent } from "../types/events";
import type { NarrativeType } from "../../types/narrative";

export function makeGenerationCompleted(
  sessionId: string,
  narrativeType: NarrativeType,
  model: string,
  latencyMs: number,
  fieldsFromAI: number,
  fieldsFallback: number,
): Extract<TelemetryEvent, { type: "generation_completed" }> {
  return {
    type: "generation_completed",
    sessionId,
    ts: Date.now(),
    narrativeType,
    model,
    latencyMs,
    fieldsFromAI,
    fieldsFallback,
    partialFallback: fieldsFallback > 0 && fieldsFromAI > 0,
  };
}
