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

  if (ctx.trends.length > 0) {
    const notStable = ctx.trends.filter(
      (t) => t.trend !== "stable" && t.trend !== "insufficient_data",
    );
    if (notStable.length > 0) {
      lines.push(`Tendência recente: ${notStable[0].dimension} ${notStable[0].trend === "improving" ? "melhorando" : "aumentando"}`);
    }
  }

  return (
    `Com base nos dados abaixo, escreva uma micro-reflexão de 1–2 frases, ` +
    `calma e observacional, para o usuário refletir sobre seus padrões recentes:\n\n${lines.join("\n")}`
  );
}
