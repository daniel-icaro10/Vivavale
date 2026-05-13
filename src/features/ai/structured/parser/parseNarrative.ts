import type { NarrativeContext, NarrativeType } from "../../types/narrative";
import type {
  StructuredNarrativeFieldName,
  StructuredNarrativeResult,
  FieldResult,
} from "../types/structuredNarrative";
import { STRUCTURED_FIELDS } from "../types/structuredNarrative";
import { cleanJsonResponse } from "../utils/cleanJsonResponse";
import { safeJsonParse } from "./safeJsonParse";
import { isStructuredNarrative } from "../schemas/narrativeSchema";
import { truncateField } from "../utils/truncateField";
import { normalizeStructuredField } from "../utils/normalizeStructuredFields";
import { validateField } from "./validateStructuredNarrative";
import { FIELD_LIMITS } from "../schemas/fieldLimits";
import { openingFallback } from "../fallbacks/openingFallback";
import { trendFallback } from "../fallbacks/trendFallback";
import { reflectionFallback } from "../fallbacks/reflectionFallback";
import { closingFallback } from "../fallbacks/closingFallback";

type FieldFallbackFn = (ctx: NarrativeContext, type: NarrativeType) => string;

const FALLBACKS: Record<StructuredNarrativeFieldName, FieldFallbackFn> = {
  opening: openingFallback,
  trend: trendFallback,
  reflection: reflectionFallback,
  closing: closingFallback,
};

export interface ParseResult {
  result: StructuredNarrativeResult;
  logs: Array<{ event: string; data?: Record<string, unknown> }>;
}

/**
 * Parser defensivo: raw string → StructuredNarrativeResult.
 *
 * Sempre retorna um resultado completo — nunca lança exceção.
 * Campos inválidos recebem fallback determinístico per-field.
 */
export function parseNarrative(
  raw: string,
  ctx: NarrativeContext,
  type: NarrativeType,
): ParseResult {
  const logs: ParseResult["logs"] = [];

  // 1. Limpa artefatos da resposta LLM
  const cleaned = cleanJsonResponse(raw);

  // 2. Parse JSON seguro
  const parsed = safeJsonParse(cleaned);

  if (!parsed) {
    logs.push({ event: "invalid_json", data: { rawLength: raw.length } });
    return { result: fullFallback(ctx, type), logs };
  }

  // 3. Validação de schema — todos os campos devem existir como strings
  if (!isStructuredNarrative(parsed)) {
    const missing = STRUCTURED_FIELDS.filter(
      (f) => typeof parsed[f] !== "string" || (parsed[f] as string).length === 0,
    );
    logs.push({ event: "missing_field", data: { missing } });
    return { result: fullFallback(ctx, type), logs };
  }

  // 4. Processamento por campo: normalize → truncate → validate → fallback se inválido
  const fields: Partial<Record<StructuredNarrativeFieldName, FieldResult>> = {};
  let aiCount = 0;
  let fallbackCount = 0;

  for (const field of STRUCTURED_FIELDS) {
    const raw_value = parsed[field];

    const normalized = normalizeStructuredField(raw_value);
    const truncated = truncateField(normalized, FIELD_LIMITS[field]);

    const validation = validateField(field, truncated);

    if (!validation.valid) {
      logs.push({
        event: "field_validation_failed",
        data: { field, reason: validation.reason },
      });
      fields[field] = { value: FALLBACKS[field](ctx, type), isAI: false };
      fallbackCount++;
    } else {
      fields[field] = { value: truncated, isAI: true };
      aiCount++;
    }
  }

  const result: StructuredNarrativeResult = {
    fields: fields as Record<StructuredNarrativeFieldName, FieldResult>,
    anyAI: aiCount > 0,
    hadPartialFallback: aiCount > 0 && fallbackCount > 0,
  };

  if (fallbackCount > 0 && aiCount > 0) {
    logs.push({ event: "partial_fallback", data: { aiCount, fallbackCount } });
  }

  return { result, logs };
}

/** Todos os campos usam fallback determinístico (falha de parse completa). */
function fullFallback(ctx: NarrativeContext, type: NarrativeType): StructuredNarrativeResult {
  return {
    fields: {
      opening: { value: openingFallback(ctx, type), isAI: false },
      trend: { value: trendFallback(ctx, type), isAI: false },
      reflection: { value: reflectionFallback(ctx, type), isAI: false },
      closing: { value: closingFallback(ctx, type), isAI: false },
    },
    anyAI: false,
    hadPartialFallback: false,
  };
}
