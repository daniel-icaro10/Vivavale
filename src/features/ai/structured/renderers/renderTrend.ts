import { ensureSentenceEnd } from "./renderUtils";

/** Renderer determinístico para o campo `trend`. */
export function renderTrend(text: string): string {
  if (!text.trim()) return "";
  return ensureSentenceEnd(text.trim());
}
