export interface GenerationMetricState {
  total: number;
  successful: number;
  fullFallbacks: number;
  partialFallbacks: number;
  invalidJsonCount: number;
  timeoutCount: number;
  providerErrorCount: number;
}

export interface LatencyMetricState {
  /** Bounded ring buffer — max MAX_LATENCY_SAMPLES entries. */
  samples: number[];
  sum: number;
  count: number;
}

export interface QualityMetricState {
  warmthSamples: number[];
  confidenceSamples: number[];
  toneSamples: number[];
  specificityRejections: number;
  repetitionRejections: number;
}

export interface FieldMetricEntry {
  ai: number;
  fallback: number;
}

export interface FieldMetricState {
  opening: FieldMetricEntry;
  trend: FieldMetricEntry;
  reflection: FieldMetricEntry;
  closing: FieldMetricEntry;
}

export interface CacheMetricState {
  hits: number;
  misses: number;
}

// ────────────────────────────────────────
// Aggregated (read) types
// ────────────────────────────────────────

export interface AggregatedGenerationMetrics {
  total: number;
  successRate: number;
  fullFallbackRate: number;
  partialFallbackRate: number;
  invalidJsonRate: number;
  timeoutRate: number;
}

export interface AggregatedLatencyMetrics {
  count: number;
  average: number;
  p50: number;
  p95: number;
  p99: number;
}

export interface AggregatedQualityMetrics {
  warmthAverage: number | null;
  confidenceAverage: number | null;
  toneAverage: number | null;
  specificityRejections: number;
  repetitionRejections: number;
}

export interface AggregatedFieldMetrics {
  opening: { aiRate: number; fallbackRate: number };
  trend: { aiRate: number; fallbackRate: number };
  reflection: { aiRate: number; fallbackRate: number };
  closing: { aiRate: number; fallbackRate: number };
}

export interface AggregatedCacheMetrics {
  hits: number;
  misses: number;
  hitRatio: number;
}

export interface AggregatedMetrics {
  generation: AggregatedGenerationMetrics;
  latency: AggregatedLatencyMetrics;
  quality: AggregatedQualityMetrics;
  fields: AggregatedFieldMetrics;
  cache: AggregatedCacheMetrics;
}
