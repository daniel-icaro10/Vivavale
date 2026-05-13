import { ensureSentenceEnd } from "./renderUtils";

/** Renderer determinístico para o campo `reflection`. */
export function renderReflection(text: string): string {
  if (!text.trim()) return "";
  return ensureSentenceEnd(text.trim());
}
