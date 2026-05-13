import type { NarrativeContext } from "../types/narrative";

export function buildWeeklySummaryPrompt(ctx: NarrativeContext): string {
  const lines: string[] = [];

  lines.push(`Registros na semana: ${ctx.daysLogged} dia(s)`);

  if (ctx.avgPain !== null) lines.push(`Média de dor: ${ctx.avgPain.toFixed(1)}/10`);
  if (ctx.avgFatigue !== null) lines.push(`Média de fadiga: ${ctx.avgFatigue.toFixed(1)}/10`);
  if (ctx.avgSleep !== null) lines.push(`Média de qualidade do sono: ${ctx.avgSleep.toFixed(1)}/10`);
  if (ctx.avgMood !== null) lines.push(`Média de humor: ${ctx.avgMood.toFixed(1)}/10`);

  const activeTrends = ctx.trends.filter(
    (t) => t.trend !== "stable" && t.trend !== "insufficient_data",
  );
  if (activeTrends.length > 0) {
    const trendLines = activeTrends.map((t) => {
      const dir = t.trend === "improving" ? "melhorou" : "piorou";
      return `${t.dimension} ${dir} em relação à semana anterior`;
    });
    lines.push(`Tendências: ${trendLines.join("; ")}`);
  }

  if (ctx.correlations.length > 0) {
    const corrLines = ctx.correlations.map(
      (c) => `padrão entre ${c.label} (${c.strength === "strong" ? "forte" : "moderado"})`,
    );
    lines.push(`Correlações: ${corrLines.join("; ")}`);
  }

  return (
    `Dados da semana para gerar o resumo narrativo em JSON:\n\n${lines.join("\n")}\n\n` +
    `Responda APENAS com o JSON no formato: {"opening":"...","trend":"...","reflection":"...","closing":"..."}`
  );
}
