import type { NarrativeContext, NarrativeType } from "../../types/narrative";

export function reflectionFallback(ctx: NarrativeContext, _type: NarrativeType): string {
  if (ctx.correlations.length > 0) {
    const corr = ctx.correlations[0];
    return `Talvez valha observar como ${corr.label.toLowerCase()} se relacionam nos seus registros.`;
  }

  if (ctx.avgSleep !== null && ctx.avgSleep < 5) {
    return "Seu humor pareceu variar nos dias com menor qualidade de sono — pode ser útil observar essa relação.";
  }

  if (ctx.avgMood !== null && ctx.avgMood >= 7) {
    return "Em alguns dias, o humor pareceu mais elevado — talvez valha perceber o que estava diferente nesses momentos.";
  }

  return "Cada registro ajuda a identificar padrões que podem não ser visíveis dia a dia.";
}
