import type { StructuredNarrativeResult } from "../types/structuredNarrative";
import { renderOpening } from "./renderOpening";
import { renderTrend } from "./renderTrend";
import { renderReflection } from "./renderReflection";
import { renderClosing } from "./renderClosing";

/**
 * Combina os quatro campos renderizados em um parágrafo único.
 * Filtra campos vazios para evitar espaços duplos.
 */
export function renderNarrative(result: StructuredNarrativeResult): string {
  const { opening, trend, reflection, closing } = result.fields;

  return [
    renderOpening(opening.value),
    renderTrend(trend.value),
    renderReflection(reflection.value),
    renderClosing(closing.value),
  ]
    .filter((s) => s.trim().length > 0)
    .join(" ");
}
