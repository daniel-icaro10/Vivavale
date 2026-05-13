import { getGenerationMetrics } from "../metrics/generationMetrics";
import { getLatencyMetrics } from "../metrics/latencyMetrics";
import { getQualityMetrics } from "../metrics/qualityMetrics";
import { getFieldMetrics } from "../metrics/fieldMetrics";
import { getCacheMetrics } from "../metrics/cacheMetrics";
import type { AggregatedMetrics, AggregatedFieldMetrics } from "../types/metrics";
import type { StructuredNarrativeFieldName } from "../../structured/types/structuredNarrative";

function safeDivide(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}

function fieldRates(
  field: StructuredNarrativeFieldName,
): { aiRate: number; fallbackRate: number } {
  const m = getFieldMetrics();
  const entry = m[field];
  const total = entry.ai + entry.fallback;
  return {
    aiRate: safeDivide(entry.ai, total),
    fallbackRate: safeDivide(entry.fallback, total),
  };
}

export function getAggregatedMetrics(): AggregatedMetrics {
  const gen = getGenerationMetrics();
  const lat = getLatencyMetrics();
  const qual = getQualityMetrics();
  const cache = getCacheMetrics();

  const fields: AggregatedFieldMetrics = {
    opening: fieldRates("opening"),
    trend: fieldRates("trend"),
    reflection: fieldRates("reflection"),
    closing: fieldRates("closing"),
  };

  return {
    generation: {
      total: gen.total,
      successRate: safeDivide(gen.successful, gen.total),
      fullFallbackRate: safeDivide(gen.fullFallbacks, gen.total),
      partialFallbackRate: safeDivide(gen.partialFallbacks, gen.total),
      invalidJsonRate: safeDivide(gen.invalidJsonCount, gen.total),
      timeoutRate: safeDivide(gen.timeoutCount, gen.total),
    },
    latency: lat,
    quality: qual,
    fields,
    cache: {
      hits: cache.hits,
      misses: cache.misses,
      hitRatio: safeDivide(cache.hits, cache.hits + cache.misses),
    },
  };
}
