import type { ReflectionInput, ReflectiveObservation, ReflectionTone } from "./types";
import { REFLECTION_POOL } from "./reflectionPool";

function pick(pool: string[], seed: number): string {
  return pool[seed % pool.length];
}

export function generateReflectiveObservation(
  input: ReflectionInput,
): ReflectiveObservation {
  const {
    longitudinalState,
    daysThisWeek,
    totalLogs,
    weightedStrain,
    weightedWellbeing,
  } = input;

  // Semente baseada em "capítulos" — muda a cada ~7 registros, criando
  // sensação de evolução contínua sem repetição rápida
  const seed = Math.floor(totalLogs / 7) * 3 + daysThisWeek;

  if (weightedStrain != null && weightedStrain >= 6.5) {
    return {
      tone: "contemplative",
      reflection: pick(REFLECTION_POOL.high_strain, seed),
      softness: 0.72,
      rarity: "common",
    };
  }

  if (
    weightedWellbeing != null &&
    weightedWellbeing >= 6.5 &&
    (weightedStrain == null || weightedStrain < 5)
  ) {
    return {
      tone: "warm",
      reflection: pick(REFLECTION_POOL.high_wellbeing, seed),
      softness: 0.45,
      rarity: "common",
    };
  }

  const stateMap: Record<
    string,
    { pool: string[]; tone: ReflectionTone; softness: number }
  > = {
    consistent: { pool: REFLECTION_POOL.consistent, tone: "warm",          softness: 0.40 },
    stable:     { pool: REFLECTION_POOL.stable,     tone: "warm",          softness: 0.50 },
    returning:  { pool: REFLECTION_POOL.returning,  tone: "gentle",        softness: 0.68 },
    fragmented: { pool: REFLECTION_POOL.fragmented, tone: "contemplative", softness: 0.75 },
    silent:     { pool: REFLECTION_POOL.general,    tone: "quiet",         softness: 0.85 },
  };

  const state = stateMap[longitudinalState] ?? {
    pool: REFLECTION_POOL.general,
    tone: "gentle" as ReflectionTone,
    softness: 0.60,
  };

  return {
    tone: state.tone,
    reflection: pick(state.pool, seed),
    softness: state.softness,
    rarity: totalLogs >= 20 ? "rare" : "common",
  };
}
