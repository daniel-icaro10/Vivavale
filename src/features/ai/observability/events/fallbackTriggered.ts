import type { TelemetryEvent, ErrorReason } from "../types/events";
import type { NarrativeType } from "../../types/narrative";

export function makeFallbackTriggered(
  sessionId: string,
  narrativeType: NarrativeType,
  reason: ErrorReason,
  full: boolean,
): Extract<TelemetryEvent, { type: "fallback_triggered" }> {
  return {
    type: "fallback_triggered",
    sessionId,
    ts: Date.now(),
    narrativeType,
    reason,
    full,
  };
}
