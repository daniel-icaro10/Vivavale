import type { TelemetryEvent, ErrorReason } from "../types/events";
import type { NarrativeType } from "../../types/narrative";

export function makeGenerationFailed(
  sessionId: string,
  narrativeType: NarrativeType,
  reason: ErrorReason,
  latencyMs: number,
): Extract<TelemetryEvent, { type: "generation_failed" }> {
  return {
    type: "generation_failed",
    sessionId,
    ts: Date.now(),
    narrativeType,
    reason,
    latencyMs,
  };
}
