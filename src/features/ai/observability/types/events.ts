import type { NarrativeType } from "../../types/narrative";
import type { StructuredNarrativeFieldName } from "../../structured/types/structuredNarrative";

export type TelemetryEventType =
  | "generation_started"
  | "generation_completed"
  | "generation_failed"
  | "fallback_triggered"
  | "parser_recovered"
  | "evaluation_rejected"
  | "timeout_triggered"
  | "cache_hit"
  | "cache_miss"
  | "field_validation_failed";

export type ErrorReason =
  | "timeout"
  | "provider_error"
  | "invalid_json"
  | "evaluation_failed"
  | "forbidden_term"
  | "parser_failure"
  | "field_validation_failure";

interface EventBase {
  sessionId: string;
  ts: number;
  narrativeType: NarrativeType;
}

export type TelemetryEvent =
  | (EventBase & {
      type: "generation_started";
      model: string;
    })
  | (EventBase & {
      type: "generation_completed";
      latencyMs: number;
      model: string;
      fieldsFromAI: number;
      fieldsFallback: number;
      partialFallback: boolean;
    })
  | (EventBase & {
      type: "generation_failed";
      latencyMs: number;
      reason: ErrorReason;
    })
  | (EventBase & {
      type: "fallback_triggered";
      reason: ErrorReason;
      full: boolean;
    })
  | (EventBase & {
      type: "parser_recovered";
      fieldsRecovered: number;
    })
  | (EventBase & {
      type: "evaluation_rejected";
      failedDimension: string;
      score: number;
    })
  | (EventBase & {
      type: "timeout_triggered";
      latencyMs: number;
    })
  | (EventBase & {
      type: "cache_hit";
    })
  | (EventBase & {
      type: "cache_miss";
    })
  | (EventBase & {
      type: "field_validation_failed";
      field: StructuredNarrativeFieldName;
      reason: string;
    });
