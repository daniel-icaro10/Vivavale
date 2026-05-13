import type { TrendDirection } from "../types/insights";
import { TREND_MIN_DELTA } from "../constants/thresholds";

/**
 * Compara médias de duas semanas.
 * Para dor, fadiga, ansiedade: valores menores = melhora.
 * Para sono, humor: valores maiores = melhora.
 */
export function computeTrendDirection(
  current: number | null,
  previous: number | null,
  higherIsBetter: boolean,
): TrendDirection {
  if (current === null || previous === null) return "insufficient_data";

  const delta = current - previous;

  if (Math.abs(delta) < TREND_MIN_DELTA) return "stable";

  const improved = higherIsBetter ? delta > 0 : delta < 0;
  return improved ? "improving" : "worsening";
}
