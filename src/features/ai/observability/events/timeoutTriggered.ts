import type { TelemetryEvent } from "../types/events";
import type { NarrativeType } from "../../types/narrative";

export function makeTimeoutTriggered(
  sessionId: string,
  narrativeType: NarrativeType,
  latencyMs: number,
): Extract<TelemetryEvent, { type: "timeout_triggered" }> {
  return {
    type: "timeout_triggered",
    sessionId,
    ts: Date.now(),
    narrativeType,
    latencyMs,
  };
}
