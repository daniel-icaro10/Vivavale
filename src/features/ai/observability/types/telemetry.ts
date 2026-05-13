import type { TelemetryEvent } from "./events";
import type { AggregatedMetrics } from "./metrics";

export interface TelemetryProvider {
  /** Chamado para cada evento rastreado. Deve ser síncrono e rápido (< 1ms). */
  track(event: TelemetryEvent): void;
  /** Flush de eventos pendentes (útil para providers que fazem batching). */
  flush(): void;
}

export type { TelemetryEvent, AggregatedMetrics };
