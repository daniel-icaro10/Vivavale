import type { TelemetryProvider } from "../types/telemetry";

/**
 * Provider noop: descarta todos os eventos.
 * Usado quando telemetria está desabilitada ou em testes unitários.
 *
 * Arquitetura preparada para: Datadog, Axiom, PostHog, OpenTelemetry, Vercel Analytics.
 * Para adicionar um novo provider: implementar TelemetryProvider e chamar setTelemetryProvider().
 */
export const noopTelemetry: TelemetryProvider = {
  track(): void {},
  flush(): void {},
};
