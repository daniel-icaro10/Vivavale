import type { TelemetryEvent } from "../types/events";
import type { TelemetryProvider } from "../types/telemetry";
import { sanitizeTelemetry } from "../utils/sanitizeTelemetry";
import { pushToBuffer } from "./telemetryBuffer";
import { updateGenerationMetrics } from "../metrics/generationMetrics";
import { updateLatencyMetrics } from "../metrics/latencyMetrics";
import { updateQualityMetrics } from "../metrics/qualityMetrics";
import { updateFieldMetrics } from "../metrics/fieldMetrics";
import { updateCacheMetrics } from "../metrics/cacheMetrics";
import { noopTelemetry } from "../providers/noopTelemetry";

let activeProvider: TelemetryProvider = noopTelemetry;

export function setTelemetryProvider(provider: TelemetryProvider): void {
  activeProvider = provider;
}

export function getTelemetryProvider(): TelemetryProvider {
  return activeProvider;
}

export function trackEvent(event: TelemetryEvent): void {
  const safe = sanitizeTelemetry(event);

  // Update in-memory metrics — all < 1ms
  updateGenerationMetrics(safe);
  updateLatencyMetrics(safe);
  updateQualityMetrics(safe);
  updateFieldMetrics(safe);
  updateCacheMetrics(safe);

  // Buffer raw event for diagnostics
  pushToBuffer(safe);

  // Forward to external provider (noop by default)
  try {
    activeProvider.track(safe);
  } catch {
    // Provider errors must never surface to callers
  }
}
