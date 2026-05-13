import type { TelemetryEvent } from "../types/events";
import type { NarrativeType } from "../../types/narrative";

export function makeEvaluationRejected(
  sessionId: string,
  narrativeType: NarrativeType,
  failedDimension: string,
  score: number,
): Extract<TelemetryEvent, { type: "evaluation_rejected" }> {
  return {
    type: "evaluation_rejected",
    sessionId,
    ts: Date.now(),
    narrativeType,
    failedDimension,
    score,
  };
}
