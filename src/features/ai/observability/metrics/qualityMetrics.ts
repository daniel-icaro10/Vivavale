import type { TelemetryEvent } from "../types/events";
import type { AggregatedQualityMetrics, QualityMetricState } from "../types/metrics";
import { average } from "../utils/percentile";

const MAX_SAMPLES = 1_000;

const state: QualityMetricState = {
  warmthSamples: [],
  confidenceSamples: [],
  toneSamples: [],
  specificityRejections: 0,
  repetitionRejections: 0,
};

function pushCapped(arr: number[], value: number): void {
  if (arr.length >= MAX_SAMPLES) arr.shift();
  arr.push(value);
}

export function updateQualityMetrics(event: TelemetryEvent): void {
  if (event.type !== "evaluation_rejected") return;

  const { failedDimension, score } = event;

  if (failedDimension === "warmth") {
    pushCapped(state.warmthSamples, score);
  } else if (failedDimension === "confidence") {
    pushCapped(state.confidenceSamples, score);
  } else if (failedDimension === "tone") {
    pushCapped(state.toneSamples, score);
  } else if (failedDimension === "specificity") {
    state.specificityRejections++;
  } else if (failedDimension === "repetition") {
    state.repetitionRejections++;
  }
}

export function getQualityMetrics(): AggregatedQualityMetrics {
  return {
    warmthAverage: state.warmthSamples.length > 0 ? average(state.warmthSamples) : null,
    confidenceAverage: state.confidenceSamples.length > 0 ? average(state.confidenceSamples) : null,
    toneAverage: state.toneSamples.length > 0 ? average(state.toneSamples) : null,
    specificityRejections: state.specificityRejections,
    repetitionRejections: state.repetitionRejections,
  };
}

export function resetQualityMetrics(): void {
  state.warmthSamples.length = 0;
  state.confidenceSamples.length = 0;
  state.toneSamples.length = 0;
  state.specificityRejections = 0;
  state.repetitionRejections = 0;
}
