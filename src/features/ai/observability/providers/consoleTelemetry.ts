import type { TelemetryProvider } from "../types/telemetry";
import type { TelemetryEvent } from "../types/events";

/**
 * Provider de desenvolvimento: serializa eventos como JSON estruturado para stdout.
 * Adequado para logs de servidor (Vercel, Railway, etc.).
 */
export const consoleTelemetry: TelemetryProvider = {
  track(event: TelemetryEvent): void {
    // Serialização mínima — exclui sessionId e ts para reduzir ruído de log.
    const { sessionId: _s, ts: _t, ...rest } = event;
    console.log(`[VivaLeve/AI/telemetry] ${event.type}`, JSON.stringify(rest));
  },

  flush(): void {
    // console não precisa de flush — no-op intencional.
  },
};
