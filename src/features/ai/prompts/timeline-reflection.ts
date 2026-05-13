import type { NarrativeContext } from "../types/narrative";

export function buildTimelineReflectionPrompt(ctx: NarrativeContext): string {
  const lines: string[] = [];

  lines.push(`Registros disponíveis: ${ctx.daysLogged}`);

  if (ctx.avgSleep !== null && ctx.avgMood !== null) {
    lines.push(`Sono médio: ${ctx.avgSleep.toFixed(1)}/10, Humor médio: ${ctx.avgMood.toFixed(1)}/10`);
  }

  if (ctx.correlations.length > 0) {
    const strongest = ctx.correlations.find((c) => c.strength === "strong") ?? ctx.correlations[0];
    lines.push(`Padrão mais relevante: ${strongest.label}`);
  }

  const notStable = ctx.trends.filter(
    (t) => t.trend !== "stable" && t.trend !== "insufficient_data",
  );
  if (notStable.length > 0) {
    lines.push(
      `Tendência recente: ${notStable[0].dimension} ${notStable[0].trend === "improving" ? "melhorando" : "aumentando"}`,
    );
  }

  return (
    `Dados para gerar micro-reflexão narrativa em JSON:\n\n${lines.join("\n")}\n\n` +
    `Responda APENAS com o JSON no formato: {"opening":"...","trend":"...","reflection":"...","closing":"..."}\n` +
    `O campo "opening" deve ser muito breve (introdução de 1 frase). Os outros campos devem ser igualmente curtos.`
  );
}
