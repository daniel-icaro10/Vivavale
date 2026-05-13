type LogLevel = "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

function log(level: LogLevel, message: string, context?: LogContext) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };

  if (level === "error") {
    console.error("[VivaLeve]", JSON.stringify(entry));
  } else if (level === "warn") {
    console.warn("[VivaLeve]", JSON.stringify(entry));
  } else {
    console.log("[VivaLeve]", JSON.stringify(entry));
  }

  // Ponto de extensão: quando Sentry ou outro SDK for integrado,
  // adicionar a chamada aqui sem alterar os call sites.
  // Ex: if (typeof window !== "undefined" && window.Sentry) { ... }
}

export const logger = {
  info: (message: string, context?: LogContext) =>
    log("info", message, context),
  warn: (message: string, context?: LogContext) =>
    log("warn", message, context),
  error: (message: string, context?: LogContext) =>
    log("error", message, context),
};
