import { setTelemetryProvider } from "./trackEvent";
import { consoleTelemetry } from "../providers/consoleTelemetry";
import { noopTelemetry } from "../providers/noopTelemetry";

let initialized = false;

/**
 * Configura o provider ativo por ambiente.
 * Chamado uma vez no processo — idempotente.
 */
export function initTelemetry(): void {
  if (initialized) return;
  initialized = true;

  const provider =
    process.env.NODE_ENV === "production" || process.env.NODE_ENV === "development"
      ? consoleTelemetry
      : noopTelemetry;

  setTelemetryProvider(provider);
}
