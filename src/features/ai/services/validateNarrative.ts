import { findForbiddenTerm } from "../constants/forbiddenTerms";

export interface ValidationResult {
  valid: boolean;
  blockedTerm?: string;
}

export function validateNarrative(text: string): ValidationResult {
  if (!text || text.trim().length < 10) {
    return { valid: false, blockedTerm: "(resposta muito curta)" };
  }

  const blocked = findForbiddenTerm(text);
  if (blocked) {
    return { valid: false, blockedTerm: blocked };
  }

  return { valid: true };
}
