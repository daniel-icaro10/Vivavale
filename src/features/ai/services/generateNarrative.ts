import OpenAI from "openai";
import { env } from "@/lib/env";
import type { NarrativeContext, NarrativeResult, NarrativeType } from "../types/narrative";
import { NARRATIVE_SYSTEM_PROMPT } from "../prompts/narrative-system";
import { buildWeeklySummaryPrompt } from "../prompts/weekly-summary";
import { buildTimelineReflectionPrompt } from "../prompts/timeline-reflection";
import { fallbackNarrative } from "../utils/fallbackNarrative";
import { parseNarrative } from "../structured/parser/parseNarrative";
import { renderNarrative } from "../structured/renderers/renderNarrative";
import { evaluateNarrative } from "../evaluation/evaluateNarrative";
import { trackEvent } from "../observability/telemetry/trackEvent";
import { SESSION_ID } from "../observability/telemetry/runtimeSession";
import { initTelemetry } from "../observability/telemetry/initTelemetry";
import { makeGenerationStarted } from "../observability/events/generationStarted";
import { makeGenerationCompleted } from "../observability/events/generationCompleted";
import { makeGenerationFailed } from "../observability/events/generationFailed";
import { makeFallbackTriggered } from "../observability/events/fallbackTriggered";
import { makeParserRecovered } from "../observability/events/parserRecovered";
import { makeTimeoutTriggered } from "../observability/events/timeoutTriggered";
import { makeCacheHit, makeCacheMiss } from "../observability/events/cacheEvents";
import type { StructuredNarrativeFieldName } from "../structured/types/structuredNarrative";

const AI_TIMEOUT_MS = 4_000;

// Cache: chave = hash do contexto + tipo. TTL = 1h.
// Apenas textos que passaram pela avaliação holística são cacheados.
const cache = new Map<string, { text: string; expiresAt: number }>();

function contextHash(ctx: NarrativeContext, type: NarrativeType): string {
  return `${type}:${JSON.stringify({
    days: ctx.daysLogged,
    p: ctx.avgPain?.toFixed(1),
    f: ctx.avgFatigue?.toFixed(1),
    s: ctx.avgSleep?.toFixed(1),
    m: ctx.avgMood?.toFixed(1),
    t: ctx.trends.map((t) => `${t.dimension}:${t.trend}`).join(","),
    c: ctx.correlations.map((c) => c.label).join(","),
  })}`;
}

let openaiClient: OpenAI | null = null;

function getClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: env.openaiApiKey ?? "" });
  }
  return openaiClient;
}

function buildUserPrompt(ctx: NarrativeContext, type: NarrativeType): string {
  return type === "weekly_summary"
    ? buildWeeklySummaryPrompt(ctx)
    : buildTimelineReflectionPrompt(ctx);
}

export async function generateNarrative(
  ctx: NarrativeContext,
  type: NarrativeType,
): Promise<NarrativeResult> {
  initTelemetry();

  // Feature flag: se desabilitado, fallback determinístico sem chamada de IA.
  if (!env.aiEnabled || !env.openaiApiKey) {
    return { text: fallbackNarrative(ctx, type), isAI: false };
  }

  const cacheKey = contextHash(ctx, type);
  const now = Date.now();
  const cached = cache.get(cacheKey);

  if (cached && cached.expiresAt > now) {
    trackEvent(makeCacheHit(SESSION_ID, type));
    return { text: cached.text, isAI: true };
  }

  trackEvent(makeCacheMiss(SESSION_ID, type));
  trackEvent(makeGenerationStarted(SESSION_ID, type, env.openaiModel));

  const start = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

    let raw: string;

    try {
      const response = await getClient().chat.completions.create(
        {
          model: env.openaiModel,
          temperature: 0.3,
          max_tokens: 300,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: NARRATIVE_SYSTEM_PROMPT },
            { role: "user", content: buildUserPrompt(ctx, type) },
          ],
        },
        { signal: controller.signal },
      );
      raw = response.choices[0]?.message?.content ?? "";
    } finally {
      clearTimeout(timeoutId);
    }

    const latencyMs = Date.now() - start;

    // Estágio 1 — parse estruturado: JSON → fields → validação por campo → partial fallback
    const { result, logs } = parseNarrative(raw, ctx, type);

    // Traduz logs do parser em eventos de telemetria
    for (const entry of logs) {
      if (entry.event === "invalid_json" || entry.event === "missing_field") {
        trackEvent(makeGenerationFailed(SESSION_ID, type, "invalid_json", latencyMs));
        trackEvent(makeFallbackTriggered(SESSION_ID, type, "invalid_json", true));
      } else if (entry.event === "field_validation_failed") {
        const field = entry.data?.field as StructuredNarrativeFieldName | undefined;
        const reason = (entry.data?.reason as string | undefined) ?? "unknown";
        trackEvent({
          type: "field_validation_failed",
          sessionId: SESSION_ID,
          ts: Date.now(),
          narrativeType: type,
          field: field ?? "opening",
          reason,
        });
      } else if (entry.event === "partial_fallback") {
        const aiCount = (entry.data?.aiCount as number | undefined) ?? 0;
        const fbCount = (entry.data?.fallbackCount as number | undefined) ?? 0;
        trackEvent(makeParserRecovered(SESSION_ID, type, aiCount));
        trackEvent(makeFallbackTriggered(SESSION_ID, type, "parser_failure", false));
        trackEvent(
          makeGenerationCompleted(SESSION_ID, type, env.openaiModel, latencyMs, aiCount, fbCount),
        );
      }
    }

    const hadParseFailure = logs.some(
      (l) => l.event === "invalid_json" || l.event === "missing_field",
    );
    const hadPartialFallback = logs.some((l) => l.event === "partial_fallback");

    if (!hadParseFailure && !hadPartialFallback) {
      trackEvent(
        makeGenerationCompleted(SESSION_ID, type, env.openaiModel, latencyMs, 4, 0),
      );
    }

    // Parse falhou completamente — fallback já embutido no result
    if (!result.anyAI) {
      return { text: renderNarrative(result), isAI: false, latencyMs };
    }

    const text = renderNarrative(result);

    // Estágio 2 — avaliação holística sobre o texto final renderizado.
    // Cobre o que a validação por campo não pode: tom, repetição, warmth do texto completo.
    // evaluation_rejected é emitido internamente por evaluateNarrative para cada dimensão reprovada.
    const evaluation = evaluateNarrative(text, type);

    if (!evaluation.approved) {
      trackEvent(makeFallbackTriggered(SESSION_ID, type, "evaluation_failed", true));
      return { text: fallbackNarrative(ctx, type), isAI: false, latencyMs };
    }

    // Cache apenas textos aprovados pela avaliação holística
    cache.set(cacheKey, { text, expiresAt: now + 60 * 60 * 1000 });

    return { text, isAI: result.anyAI, latencyMs };
  } catch (err) {
    const latencyMs = Date.now() - start;
    const isTimeout = err instanceof Error && err.name === "AbortError";

    if (isTimeout) {
      trackEvent(makeTimeoutTriggered(SESSION_ID, type, latencyMs));
      trackEvent(makeFallbackTriggered(SESSION_ID, type, "timeout", true));
    } else {
      trackEvent(makeGenerationFailed(SESSION_ID, type, "provider_error", latencyMs));
      trackEvent(makeFallbackTriggered(SESSION_ID, type, "provider_error", true));
    }

    return { text: fallbackNarrative(ctx, type), isAI: false, latencyMs };
  }
}
