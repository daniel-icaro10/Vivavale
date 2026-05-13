import type { NarrativeType } from "../types/narrative";
import type { NarrativeEvaluation } from "./types/evaluation";
import { SCORE_THRESHOLDS } from "./types/evaluation";
import { warmthScore } from "./scoring/warmthScore";
import { confidenceScore } from "./scoring/confidenceScore";
import { specificityScore } from "./scoring/specificityScore";
import { toneScore } from "./scoring/toneScore";
import { repetitionScore } from "./scoring/repetitionScore";
import { trackEvent } from "../observability/telemetry/trackEvent";
import { SESSION_ID } from "../observability/telemetry/runtimeSession";
import { makeEvaluationRejected } from "../observability/events/evaluationRejected";

/**
 * Evaluator central — agrega todos os scores e decide aprovação.
 *
 * Pipeline: generate → sanitize → validate → evaluate → approve/reject
 *
 * Determinístico. Sem chamadas externas. Deve executar em < 10ms.
 */
export function evaluateNarrative(
  text: string,
  type: NarrativeType,
): NarrativeEvaluation {
  const allFlags: string[] = [];

  const warmth = warmthScore(text);
  const confidence = confidenceScore(text);
  const specificity = specificityScore(text);
  const tone = toneScore(text);
  const repetition = repetitionScore(text, type);

  allFlags.push(...warmth.flags, ...confidence.flags, ...specificity.flags, ...tone.flags, ...repetition.flags);

  const scores = {
    warmth: warmth.score,
    confidence: confidence.score,
    tone: tone.score,
    specificity: specificity.score,
    repetition: repetition.score,
  };

  // Aprovação: todos os scores devem atingir o mínimo
  const failures: string[] = [];
  if (scores.warmth < SCORE_THRESHOLDS.warmth) {
    failures.push(`warmth ${scores.warmth} < ${SCORE_THRESHOLDS.warmth}`);
    trackEvent(makeEvaluationRejected(SESSION_ID, type, "warmth", scores.warmth));
  }
  if (scores.confidence < SCORE_THRESHOLDS.confidence) {
    failures.push(`confidence ${scores.confidence} < ${SCORE_THRESHOLDS.confidence}`);
    trackEvent(makeEvaluationRejected(SESSION_ID, type, "confidence", scores.confidence));
  }
  if (scores.tone < SCORE_THRESHOLDS.tone) {
    failures.push(`tone ${scores.tone} < ${SCORE_THRESHOLDS.tone}`);
    trackEvent(makeEvaluationRejected(SESSION_ID, type, "tone", scores.tone));
  }
  if (scores.specificity < SCORE_THRESHOLDS.specificity) {
    failures.push(`specificity ${scores.specificity} < ${SCORE_THRESHOLDS.specificity}`);
    trackEvent(makeEvaluationRejected(SESSION_ID, type, "specificity", scores.specificity));
  }
  if (scores.repetition < SCORE_THRESHOLDS.repetition) {
    failures.push(`repetition ${scores.repetition} < ${SCORE_THRESHOLDS.repetition}`);
    trackEvent(makeEvaluationRejected(SESSION_ID, type, "repetition", scores.repetition));
  }

  const approved = failures.length === 0;

  return {
    approved,
    scores,
    flags: allFlags,
    fallbackReason: approved ? undefined : failures.join("; "),
  };
}
