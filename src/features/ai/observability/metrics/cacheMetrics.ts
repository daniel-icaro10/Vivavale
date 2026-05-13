import type { TelemetryEvent } from "../types/events";
import type { CacheMetricState } from "../types/metrics";

const state: CacheMetricState = {
  hits: 0,
  misses: 0,
};

export function updateCacheMetrics(event: TelemetryEvent): void {
  if (event.type === "cache_hit") {
    state.hits++;
  } else if (event.type === "cache_miss") {
    state.misses++;
  }
}

export function getCacheMetrics(): Readonly<CacheMetricState> {
  return { ...state };
}

export function resetCacheMetrics(): void {
  state.hits = 0;
  state.misses = 0;
}
