import type { TelemetryEvent } from "../types/events";
import type { AggregatedLatencyMetrics } from "../types/metrics";
import { percentile, average } from "../utils/percentile";

const MAX_SAMPLES = 1_000;

const samples: number[] = [];
let _sum = 0;
let count = 0;

export function updateLatencyMetrics(event: TelemetryEvent): void {
  let latency: number | undefined;

  if (event.type === "generation_completed" || event.type === "generation_failed") {
    latency = event.latencyMs;
  } else if (event.type === "timeout_triggered") {
    latency = event.latencyMs;
  }

  if (latency === undefined) return;

  // Ring buffer: descarta o mais antigo quando atinge MAX_SAMPLES
  if (samples.length >= MAX_SAMPLES) {
    const removed = samples.shift() ?? 0;
    _sum -= removed;
    count--;
  }

  samples.push(latency);
  _sum += latency;
  count++;
}

export function getLatencyMetrics(): AggregatedLatencyMetrics {
  return {
    count,
    average: average(samples),
    p50: percentile(samples, 50),
    p95: percentile(samples, 95),
    p99: percentile(samples, 99),
  };
}

export function resetLatencyMetrics(): void {
  samples.length = 0;
  _sum = 0;
  count = 0;
}
