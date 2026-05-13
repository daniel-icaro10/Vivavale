import type { TelemetryEvent } from "../types/events";

/** Comprimento máximo de string permitido em campos de evento (guard against narrative leakage). */
const MAX_STRING_LENGTH = 120;

/**
 * Valida que nenhum campo do evento contém texto longo (que poderia ser uma narrativa vazando).
 * Lança em desenvolvimento, silencia em produção.
 */
export function sanitizeTelemetry(event: TelemetryEvent): TelemetryEvent {
  for (const [key, value] of Object.entries(event)) {
    if (typeof value === "string" && value.length > MAX_STRING_LENGTH) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[VivaLeve/AI/Telemetry] Campo "${key}" excede ${MAX_STRING_LENGTH} chars — possível vazamento de narrativa. Truncando.`,
        );
      }
      // Trunca defensivamente em vez de bloquear o evento inteiro
      (event as unknown as Record<string, unknown>)[key] = value.slice(0, MAX_STRING_LENGTH) + "…";
    }
  }
  return event;
}
