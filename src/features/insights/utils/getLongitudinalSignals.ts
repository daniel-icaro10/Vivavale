export type LongitudinalState =
  | "silent"
  | "returning"
  | "consistent"
  | "stable"
  | "fragmented"
  | "neutral";

export type LongitudinalTone = "warm" | "quiet" | "contemplative" | "gentle";

export interface LongitudinalSignals {
  state: LongitudinalState;
  tone: LongitudinalTone;
  /** Frase de eco temporal — null quando dados insuficientes. */
  narrative: string | null;
  /** 0–1: menor = mais presença visual; maior = mais silêncio. */
  softness: number;
}

export function getLongitudinalSignals({
  daysSinceLastLog,
  daysThisWeek,
  totalLogs,
}: {
  daysSinceLastLog: number | null;
  daysThisWeek: number;
  totalLogs: number;
}): LongitudinalSignals {
  // Dados insuficientes para padrão longitudinal
  if (totalLogs < 3) {
    return { state: "neutral", tone: "gentle", narrative: null, softness: 0.8 };
  }

  // Silêncio longo (2+ semanas)
  if (daysSinceLastLog !== null && daysSinceLastLog >= 14) {
    return {
      state: "silent",
      tone: "quiet",
      narrative: "Há mais silêncio entre os registros recentes.",
      softness: 0.88,
    };
  }

  // Retornando (4–13 dias de pausa)
  if (daysSinceLastLog !== null && daysSinceLastLog >= 4) {
    return {
      state: "returning",
      tone: "gentle",
      narrative: "Há mais pausas entre os registros recentemente.",
      softness: 0.75,
    };
  }

  // Consistência alta
  if (daysThisWeek >= 5) {
    return {
      state: "consistent",
      tone: "warm",
      narrative: "Os últimos dias pareceram mais constantes.",
      softness: 0.30,
    };
  }

  // Ritmo estável
  if (daysThisWeek >= 3) {
    return {
      state: "stable",
      tone: "warm",
      narrative: "O ritmo desta semana parece mais regular.",
      softness: 0.50,
    };
  }

  // Fragmentado (registros esparsos com histórico)
  if (daysThisWeek <= 1 && totalLogs >= 5) {
    return {
      state: "fragmented",
      tone: "contemplative",
      narrative: "O ritmo desta semana está mais espaçado.",
      softness: 0.78,
    };
  }

  return { state: "neutral", tone: "gentle", narrative: null, softness: 0.60 };
}
