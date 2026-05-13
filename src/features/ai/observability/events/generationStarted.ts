import type { TelemetryEvent } from "../types/events";
import type { NarrativeType } from "../../types/narrative";

export function makeGenerationStarted(
  sessionId: string,
  narrativeType: NarrativeType,
  model: string,
): Extract<TelemetryEvent, { type: "generation_started" }> {
  return {
    type: "generation_started",
    sessionId,
    ts: Date.now(),
    narrativeType,
    model,
  };
}
