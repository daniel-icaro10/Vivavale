import type { WeeklyInsights } from "@/features/insights/types/insights";

export function getWeeklyClosing(insights: WeeklyInsights): string | null {
  const { avgPain, avgFatigue, avgSleep, avgMood, daysLogged, trends } = insights;

  if (daysLogged === 0) return null;

  const strain    = ((avgPain    ?? 5) + (avgFatigue ?? 5)) / 2;
  const wellbeing = ((avgMood    ?? 5) + (avgSleep   ?? 5)) / 2;
  const balance   = wellbeing - strain;
  const hasTrends = trends.length >= 2;

  if (strain >= 6.5) {
    return "Alguns momentos desta semana parecem ter exigido mais do corpo.";
  }

  if (balance >= 2.5 && wellbeing >= 6) {
    return hasTrends
      ? "Os registros desta semana revelam algo sobre como os momentos se conectam."
      : "Há uma leveza nos dados desta semana.";
  }

  if (daysLogged >= 5 && hasTrends) {
    return "A regularidade desta semana ajuda a perceber continuidades.";
  }

  if (Math.abs(balance) < 1.5 && daysLogged >= 3) {
    return "Cada semana carrega seu próprio ritmo.";
  }

  if (daysLogged <= 2) {
    return "Mesmo entradas espaçadas ajudam a perceber padrões.";
  }

  return null;
}
