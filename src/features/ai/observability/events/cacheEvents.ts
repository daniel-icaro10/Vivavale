import type { TelemetryEvent } from "../types/events";
import type { NarrativeType } from "../../types/narrative";

export function makeCacheHit(
  sessionId: string,
  narrativeType: NarrativeType,
): Extract<TelemetryEvent, { type: "cache_hit" }> {
  return { type: "cache_hit", sessionId, ts: Date.now(), narrativeType };
}

export function makeCacheMiss(
  sessionId: string,
  narrativeType: NarrativeType,
): Extract<TelemetryEvent, { type: "cache_miss" }> {
  return { type: "cache_miss", sessionId, ts: Date.now(), narrativeType };
}
