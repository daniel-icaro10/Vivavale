// Journey chapter system — Memory Continuity 2.0.
// Mapeia o estado longitudinal para um "capítulo" narrativo da jornada do usuário.
// Objetivo: o histórico sentir como memória contínua, não banco de dados.

import type { LongitudinalState } from "@/features/insights/utils/getLongitudinalSignals";
import type { CognitiveLoad } from "@/features/ux/cognitive/detectCognitiveLoad";

export type JourneyChapter =
  | "first-steps"    // poucos registros — jornada começando
  | "finding-rhythm" // ritmo emergindo, mas ainda irregular
  | "in-flow"        // presença consistente, continuidade estabelecida
  | "quiet-return"   // retorno após pausa de 7–13 dias
  | "long-return"    // retorno após ausência longa (via "rebuilding" cognitivo)
  | "holding-on"     // padrão fragmentado, mas persistindo
  | "rebuilding";    // recuperando após silêncio longo

export interface ChapterResult {
  chapter: JourneyChapter;
  /** Frase de continuidade sutil — null quando não há histórico suficiente. */
  continuityPhrase: string | null;
  tone: "warm" | "gentle" | "quiet" | "contemplative";
}

export function getJourneyChapter({
  totalLogs,
  daysSinceLastLog,
  longitudinalState,
  cognitiveLoad,
}: {
  totalLogs: number;
  daysSinceLastLog: number | null;
  longitudinalState: LongitudinalState;
  cognitiveLoad: CognitiveLoad;
}): ChapterResult {
  // Recovering: ausência muito longa ou estado "silent"
  if (cognitiveLoad === "recovering" || longitudinalState === "silent") {
    return {
      chapter: "rebuilding",
      continuityPhrase: totalLogs >= 5 ? "Os registros anteriores ainda estão aqui." : null,
      tone: "quiet",
    };
  }

  // Primeiros passos — histórico insuficiente para padrão
  if (totalLogs < 3) {
    return {
      chapter: "first-steps",
      continuityPhrase: null,
      tone: "gentle",
    };
  }

  // Retorno silencioso — pausa de 7 a 13 dias
  if (daysSinceLastLog !== null && daysSinceLastLog >= 7) {
    return {
      chapter: "quiet-return",
      continuityPhrase: "Uma pausa, e agora de volta.",
      tone: "gentle",
    };
  }

  // Holding on — padrão fragmentado com histórico presente
  if (longitudinalState === "fragmented" || cognitiveLoad === "fragile") {
    return {
      chapter: "holding-on",
      continuityPhrase: totalLogs >= 5 ? "Os registros continuam, mesmo que espaçados." : null,
      tone: "contemplative",
    };
  }

  // Finding rhythm — histórico pequeno ou retornando
  if (totalLogs < 7 || longitudinalState === "returning") {
    return {
      chapter: "finding-rhythm",
      continuityPhrase: null,
      tone: "gentle",
    };
  }

  // In flow — presença estabelecida
  return {
    chapter: "in-flow",
    continuityPhrase: longitudinalState === "consistent" ? "Há uma continuidade aqui." : null,
    tone: "warm",
  };
}
