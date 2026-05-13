import OpenAI from "openai";
import { env } from "@/lib/env";
import type { NarrativeContext, NarrativeResult, NarrativeType } from "../types/narrative";
import { NARRATIVE_SYSTEM_PROMPT } from "../prompts/narrative-system";
import { buildWeeklySummaryPrompt } from "../prompts/weekly-summary";
import { buildTimelineReflectionPrompt } from "../prompts/timeline-reflection";
import { sanitizeNarrative } from "./sanitizeNarrative";
import { validateNarrative } from "./validateNarrative";
import { fallbackNarrative } from "../utils/fallbackNarrative";

const AI_TIMEOUT_MS = 4_000;

// Cache em memória: chave = hash do contexto + tipo. TTL = 1h (module-level, persiste entre requests).
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

function logAI(event: string, data?: Record<string, unknown>) {
  // Observabilidade: apenas metadados, nunca conteúdo sensível do usuário.
  console.log(`[VivaLeve/AI] ${event}`, data ?? "");
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
  // Feature flag: se desabilitado, retorna fallback sem fazer nenhuma chamada de IA.
  if (!env.aiEnabled || !env.openaiApiKey) {
    return { text: fallbackNarrative(ctx, type), isAI: false };
  }

  const cacheKey = contextHash(ctx, type);
  const now = Date.now();
  const cached = cache.get(cacheKey);

  if (cached && cached.expiresAt > now) {
    logAI("cache_hit", { type });
    return { text: cached.text, isAI: true };
  }

  const start = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

    let raw: string;

    try {
      const response = await getClient().chat.completions.create(
        {
          model: env.openaiModel,
          temperature: 0.4,
          max_tokens: 200,
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
    logAI("generated", { type, latencyMs });

    const sanitized = sanitizeNarrative(raw);
    const validation = validateNarrative(sanitized);

    if (!validation.valid) {
      logAI("forbidden_term_blocked", { type, term: validation.blockedTerm });
      return { text: fallbackNarrative(ctx, type), isAI: false, latencyMs };
    }

    // Cache por 1h — mesma semana de dados = mesmo resumo.
    cache.set(cacheKey, { text: sanitized, expiresAt: now + 60 * 60 * 1000 });

    return { text: sanitized, isAI: true, latencyMs };
  } catch (err) {
    const latencyMs = Date.now() - start;
    const isTimeout = err instanceof Error && err.name === "AbortError";

    logAI(isTimeout ? "timeout" : "error", {
      type,
      latencyMs,
      message: err instanceof Error ? err.message : "unknown",
    });

    return { text: fallbackNarrative(ctx, type), isAI: false, latencyMs };
  }
}
