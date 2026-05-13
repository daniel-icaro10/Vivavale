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
        ? "Em dias com mais dor, você também tende a registrar mais fadiga."
        : "Em dias com mais dor, a fadiga parece menor — um padrão incomum que vale observar.",
  },
  {
    keyA: "sleep_quality",
    keyB: "mood_level",
    label: "Sono e humor",
    body: (r) =>
      r > 0
        ? "Noites com melhor sono parecem estar associadas a um humor mais elevado no dia seguinte."
        : "Sono e humor parecem seguir caminhos opostos — pode ser útil observar esse padrão.",
  },
  {
    keyA: "sleep_quality",
    keyB: "fatigue_level",
    label: "Sono e fadiga",
    body: (r) =>
      r < 0
        ? "Noites com pior sono tendem a coincidir com mais fadiga no dia seguinte."
        : "Sono e fadiga estão correlacionados positivamente — vale acompanhar.",
  },
  {
    keyA: "fatigue_level",
    keyB: "mood_level",
    label: "Fadiga e humor",
    body: (r) =>
      r < 0
        ? "Dias com mais fadiga tendem a coincidir com humor mais baixo."
        : "Fadiga e humor seguem direção parecida nos seus registros.",
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
