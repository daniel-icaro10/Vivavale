export function getQuietInsight({
  daysSinceLastLog,
  daysThisWeek,
  totalLogs,
}: {
  daysSinceLastLog: number | null;
  daysThisWeek: number;
  totalLogs: number;
}): string | null {
  if (totalLogs < 3) return null;

  if (daysSinceLastLog !== null && daysSinceLastLog >= 7) {
    return "Mesmo pausas longas ainda fazem parte da continuidade.";
  }
  if (daysThisWeek >= 6 && totalLogs >= 10) {
    return "Seu ritmo tem sido mais constante esta semana.";
  }
  if (totalLogs >= 7 && daysThisWeek >= 3) {
    return "Os registros começam a formar padrões.";
  }
  if (daysThisWeek === 0 && totalLogs >= 5) {
    return "Mesmo registros espaçados ainda ajudam a observar padrões.";
  }

  return null;
}
