import { ensureSentenceEnd } from "./renderUtils";

/** Renderer determinístico para o campo `closing`. */
export function renderClosing(text: string): string {
  if (!text.trim()) return "";
  return ensureSentenceEnd(text.trim());
}
