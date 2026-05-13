import type { DailyLog } from "@/types/app";
import type { CorrelationInsight } from "../types/insights";
import {
  CORRELATION_THRESHOLD_STRONG,
  CORRELATION_THRESHOLD_MODERATE,
  MIN_LOGS_FOR_CORRELATION,
} from "../constants/thresholds";

function pearson(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n < 2) return 0;

  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;

  let num = 0, denomX = 0, denomY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }

  const denom = Math.sqrt(denomX * denomY);
  return denom === 0 ? 0 : num / denom;
}

type DimensionPair = {
  keyA: keyof DailyLog;
  keyB: keyof DailyLog;
  label: string;
  body: (r: number) => string;
};

const PAIRS: DimensionPair[] = [
  {
    keyA: "pain_level",
    keyB: "fatigue_level",
    label: "Dor e fadiga",
    body: (r) =>
      r > 0
        ? "Seus registros mostram que dor e fadiga tendem a aparecer em níveis parecidos no mesmo dia."
        : "Seus registros mostram uma associação incomum: dor e fadiga nem sempre aparecem juntas — um padrão que vale observar.",
  },
  {
    keyA: "sleep_quality",
    keyB: "mood_level",
    label: "Sono e humor",
    body: (r) =>
      r > 0
        ? "Registros com sono melhor avaliado também mostraram humor mais elevado nesse mesmo período."
        : "Alguns registros mostram sono e humor seguindo direções opostas — um padrão que pode valer acompanhar.",
  },
  {
    keyA: "sleep_quality",
    keyB: "fatigue_level",
    label: "Sono e fadiga",
    body: (r) =>
      r < 0
        ? "Registros com sono pior avaliado tenderam a aparecer junto de níveis mais altos de fadiga."
        : "Seus registros mostram sono e fadiga em direção parecida — um padrão que vale acompanhar.",
  },
  {
    keyA: "fatigue_level",
    keyB: "mood_level",
    label: "Fadiga e humor",
    body: (r) =>
      r < 0
        ? "Registros com fadiga mais alta também mostraram níveis de humor mais baixos nesse mesmo dia."
        : "Em seus registros, fadiga e humor parecem seguir uma direção parecida.",
  },
];

export function computeCorrelations(logs: DailyLog[]): CorrelationInsight[] {
  if (logs.length < MIN_LOGS_FOR_CORRELATION) return [];

  const results: CorrelationInsight[] = [];

  for (const pair of PAIRS) {
    const xs = logs.map((l) => (l[pair.keyA] as number) ?? 0);
    const ys = logs.map((l) => (l[pair.keyB] as number) ?? 0);
    const r = pearson(xs, ys);
    const absR = Math.abs(r);

    if (absR >= CORRELATION_THRESHOLD_STRONG) {
      results.push({
        dimensionA: String(pair.keyA),
        dimensionB: String(pair.keyB),
        label: pair.label,
        body: pair.body(r),
        strength: "strong",
      });
    } else if (absR >= CORRELATION_THRESHOLD_MODERATE) {
      results.push({
        dimensionA: String(pair.keyA),
        dimensionB: String(pair.keyB),
        label: pair.label,
        body: pair.body(r),
        strength: "moderate",
      });
    }
  }

  return results;
}
