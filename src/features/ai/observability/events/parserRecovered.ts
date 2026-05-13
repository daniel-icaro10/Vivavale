import type { TelemetryEvent } from "../types/events";
import type { NarrativeType } from "../../types/narrative";

export function makeParserRecovered(
  sessionId: string,
  narrativeType: NarrativeType,
  fieldsRecovered: number,
): Extract<TelemetryEvent, { type: "parser_recovered" }> {
  return {
    type: "parser_recovered",
    sessionId,
    ts: Date.now(),
    narrativeType,
    fieldsRecovered,
  };
}
