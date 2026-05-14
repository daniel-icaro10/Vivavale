import type { CognitiveLoad } from "./detectCognitiveLoad";

/** Retorna true quando motion deve ser reduzido por carga cognitiva. */
export function shouldReduceMotion(load: CognitiveLoad): boolean {
  return load === "fragile" || load === "recovering";
}

/** Duração de animação adaptada à carga cognitiva. */
export function getAdaptiveAnimDuration(load: CognitiveLoad): string {
  switch (load) {
    case "fragile":
    case "recovering": return "duration-[80ms]";
    case "reduced":    return "duration-[150ms]";
    case "calm":       return "duration-[200ms]";
  }
}
