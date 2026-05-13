import { ensureSentenceEnd } from "./renderUtils";

/**
 * Renderer determinístico para o campo `opening`.
 * Garante pontuação, capitalização inicial e ausência de artefatos.
 */
export function renderOpening(text: string): string {
  if (!text.trim()) return "";
  return ensureSentenceEnd(capitalize(text.trim()));
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
