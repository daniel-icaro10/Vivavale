import type { NarrativeType } from "../../types/narrative";

export interface EvaluationScores {
  /** 0–100. Detecta linguagem fria/robótica. Mínimo: 65. */
  warmth: number;
  /** 0–100. Detecta excesso de certeza/assertividade. Mínimo: 70. */
  confidence: number;
  /** 0–100. Detecta tom inadequado (médico, autoritário, coach). Mínimo: 75. */
  tone: number;
  /** 0–100. Detecta especificidade não suportada pelos dados. Mínimo: 85. */
  specificity: number;
  /** 0–100. Detecta repetição estrutural entre chamadas. Mínimo: 60. */
  repetition: number;
}

export interface NarrativeEvaluation {
  approved: boolean;
  scores: EvaluationScores;
  flags: string[];
  fallbackReason?: string;
}

export interface ScoreThresholds {
  readonly warmth: number;
  readonly confidence: number;
  readonly tone: number;
  readonly specificity: number;
  readonly repetition: number;
}

export const SCORE_THRESHOLDS: ScoreThresholds = {
  warmth: 65,
  confidence: 70,
  tone: 75,
  specificity: 85,
  repetition: 60,
} as const;

export type { NarrativeType };
