import type { TelemetryEvent } from "../types/events";
import type { GenerationMetricState } from "../types/metrics";

const state: GenerationMetricState = {
  total: 0,
  successful: 0,
  fullFallbacks: 0,
  partialFallbacks: 0,
  invalidJsonCount: 0,
  timeoutCount: 0,
  providerErrorCount: 0,
};

export function updateGenerationMetrics(event: TelemetryEvent): void {
  if (event.type === "generation_started") {
    state.total++;
  } else if (event.type === "generation_completed") {
    state.successful++;
    if (event.partialFallback) state.partialFallbacks++;
  } else if (event.type === "generation_failed") {
    if (event.reason === "invalid_json") state.invalidJsonCount++;
    if (event.reason === "timeout") state.timeoutCount++;
    if (event.reason === "provider_error") state.providerErrorCount++;
  } else if (event.type === "fallback_triggered" && event.full) {
    state.fullFallbacks++;
  }
}

export function getGenerationMetrics(): Readonly<GenerationMetricState> {
  return { ...state };
}

export function resetGenerationMetrics(): void {
  Object.assign(state, {
    total: 0, successful: 0, fullFallbacks: 0, partialFallbacks: 0,
    invalidJsonCount: 0, timeoutCount: 0, providerErrorCount: 0,
  });
}
