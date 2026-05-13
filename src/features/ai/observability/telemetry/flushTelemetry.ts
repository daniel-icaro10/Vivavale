import { getTelemetryProvider } from "./trackEvent";

export function flushTelemetry(): void {
  try {
    getTelemetryProvider().flush();
  } catch {
    // Flush errors are non-fatal
  }
}
