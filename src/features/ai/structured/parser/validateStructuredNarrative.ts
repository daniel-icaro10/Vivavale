import type { StructuredNarrativeFieldName } from "../types/structuredNarrative";
import { FIELD_LIMITS, FIELD_MIN_LENGTH } from "../schemas/fieldLimits";
import { findForbiddenTerm } from "../../constants/forbiddenTerms";
import { OVERCONFIDENT_TERMS } from "../../evaluation/constants/overconfidentTerms";
import { UNSUPPORTED_SPECIFICITY_PATTERNS } from "../../evaluation/constants/unsupportedSpecificity";

export interface FieldValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Valida um campo individual da narrativa estruturada.
 * Checks: comprimento (min/max), termos proibidos, excesso de confiança, especificidade inválida.
 */
export function validateField(
  field: StructuredNarrativeFieldName,
  value: string,
): FieldValidationResult {
  // Comprimento mínimo
  if (value.length < FIELD_MIN_LENGTH[field]) {
    return { valid: false, reason: `too_short (${value.length} < ${FIELD_MIN_LENGTH[field]})` };
  }

  // Comprimento máximo (já truncado, mas verificação de segurança)
  if (value.length > FIELD_LIMITS[field]) {
    return { valid: false, reason: `too_long (${value.length} > ${FIELD_LIMITS[field]})` };
  }

  // Termos proibidos (fase 16)
  const forbidden = findForbiddenTerm(value);
  if (forbidden) {
    return { valid: false, reason: `forbidden_term: ${forbidden}` };
  }

  // Termos de excesso de confiança
  for (const re of OVERCONFIDENT_TERMS) {
    if (re.test(value)) {
      return { valid: false, reason: `overconfident: ${re.source}` };
    }
  }

  // Especificidade não suportada
  for (const re of UNSUPPORTED_SPECIFICITY_PATTERNS) {
    if (re.test(value)) {
      return { valid: false, reason: `unsupported_specificity: ${re.source}` };
    }
  }

  return { valid: true };
}
