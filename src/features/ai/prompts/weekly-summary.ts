import type { NarrativeContext } from "../types/narrative";

export function buildWeeklySummaryPrompt(ctx: NarrativeContext): string {
  const lines: string[] = [];

  lines.push(`Registros na semana: ${ctx.daysLogged} dia(s)`);

  if (ctx.avgPain !== null) lines.push(`Média de dor: ${ctx.avgPain.toFixed(1)}/10`);
  if (ctx.avgFatigue !== null) lines.push(`Média de fadiga: ${ctx.avgFatigue.toFixed(1)}/10`);
  if (ctx.avgSleep !== null) lines.push(`Média de qualidade do sono: ${ctx.avgSleep.toFixed(1)}/10`);
  if (ctx.avgMood !== null) lines.push(`Média de humor: ${ctx.avgMood.toFixed(1)}/10`);

  if (ctx.trends.length > 0) {
    const trendLines = ctx.trends
      .filter((t) => t.trend !== "stable" && t.trend !== "insufficient_data")
      .map((t) => {
        const dir = t.trend === "improving" ? "melhorou" : "piorou";
        return `${t.dimension} ${dir} em relação à semana anterior`;
      });
    if (trendLines.length > 0) lines.push(`Tendências: ${trendLines.join("; ")}`);
  }

  if (ctx.correlations.length > 0) {
    const corrLines = ctx.correlations.map(
      (c) => `padrão observado entre ${c.label} (intensidade: ${c.strength === "strong" ? "forte" : "moderada"})`,
    );
    lines.push(`Correlações: ${corrLines.join("; ")}`);
  }

  return (
    `Com base nos seguintes dados da semana, escreva um resumo narrativo breve (2–3 frases), ` +
    `acolhedor e observacional:\n\n${lines.join("\n")}`
  );
}
