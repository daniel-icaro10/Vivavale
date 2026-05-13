import type { NarrativeContext, NarrativeType } from "../../types/narrative";

export function trendFallback(ctx: NarrativeContext, _type: NarrativeType): string {
  const notable = ctx.trends.find((t) => t.trend === "improving" || t.trend === "worsening");

  if (notable) {
    const dimLabel: Record<string, string> = {
      pain: "a dor",
      fatigue: "a fadiga",
      sleep: "o sono",
      mood: "o humor",
    };
    const label = dimLabel[notable.dimension] ?? notable.dimension;
    const dir = notable.trend === "improving" ? "apresentou melhora" : "tende a estar mais elevado";
    return `Parece que ${label} ${dir} em relação à semana anterior.`;
  }

  if (ctx.avgPain !== null) {
    const level =
      ctx.avgPain <= 3 ? "níveis baixos" : ctx.avgPain <= 6 ? "níveis moderados" : "níveis mais elevados";
    return `Os registros mostram dor em ${level} ao longo da semana.`;
  }

  return "Parece haver um padrão em desenvolvimento nos seus registros.";
}
