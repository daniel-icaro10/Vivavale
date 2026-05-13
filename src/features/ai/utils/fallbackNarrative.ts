import type { NarrativeContext, NarrativeType } from "../types/narrative";

export function fallbackNarrative(
  ctx: NarrativeContext,
  type: NarrativeType,
): string {
  if (ctx.daysLogged === 0) {
    return "Nenhum registro encontrado neste período.";
  }

  if (type === "timeline_reflection") {
    return buildReflection(ctx);
  }

  return buildWeeklySummary(ctx);
}

function buildWeeklySummary(ctx: NarrativeContext): string {
  const parts: string[] = [];

  if (ctx.daysLogged === 1) {
    parts.push(`Você fez 1 registro nesta semana.`);
  } else {
    parts.push(`Ao longo de ${ctx.daysLogged} dias registrados`);

    const observations: string[] = [];
    if (ctx.avgPain !== null) {
      observations.push(
        ctx.avgPain <= 3
          ? "dor em níveis baixos"
          : ctx.avgPain <= 6
            ? "dor em níveis moderados"
            : "dor em níveis mais elevados",
      );
    }
    if (ctx.avgSleep !== null) {
      observations.push(
        ctx.avgSleep >= 7
          ? "sono satisfatório"
          : ctx.avgSleep >= 4
            ? "sono irregular"
            : "sono difícil",
      );
    }
    if (observations.length > 0) {
      const last = observations.pop();
      const joined = observations.length > 0
        ? `${observations.join(", ")} e ${last}`
        : last;
      parts[0] += `, você registrou ${joined}.`;
    } else {
      parts[0] += `, seus sintomas ficaram dentro do esperado.`;
    }
  }

  const trendNotable = ctx.trends.find((t) => t.trend === "improving" || t.trend === "worsening");
  if (trendNotable) {
    const verb = trendNotable.trend === "improving" ? "apresentou melhora" : "tende a estar mais elevado";
    parts.push(`${trendNotable.dimension === "pain" ? "A dor" : trendNotable.dimension === "fatigue" ? "A fadiga" : trendNotable.dimension === "sleep" ? "O sono" : "O humor"} ${verb} em relação à semana anterior.`);
  }

  if (ctx.correlations.length > 0) {
    parts.push(`Parece haver um padrão entre ${ctx.correlations[0].label.toLowerCase()} nos seus registros.`);
  }

  return parts.join(" ");
}

function buildReflection(ctx: NarrativeContext): string {
  if (ctx.correlations.length > 0) {
    return `Parece haver um padrão entre ${ctx.correlations[0].label.toLowerCase()} ao longo dos seus registros. Talvez valha observar como esses dias se relacionam.`;
  }

  if (ctx.trends.some((t) => t.trend === "improving")) {
    return `Os últimos registros parecem mais estáveis que os anteriores. Continue observando como você se sente dia a dia.`;
  }

  if (ctx.avgSleep !== null && ctx.avgMood !== null && ctx.avgSleep < 5) {
    return `Seu humor pareceu variar nos dias com menor qualidade de sono. Talvez valha observar essa relação.`;
  }

  return `Os registros acumulados permitem observar como seus sintomas variam ao longo do tempo.`;
}
