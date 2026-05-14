interface InsightsStripProps {
  daysThisWeek: number;
  activeMedicationsCount: number;
  activeRemindersCount: number;
}

function getContextSentence(
  daysThisWeek: number,
  activeMedicationsCount: number,
  activeRemindersCount: number,
): string {
  const hasReminders = activeRemindersCount > 0;

  if (daysThisWeek === 0) {
    return activeMedicationsCount > 0
      ? "Essa semana ainda não tem registros."
      : "Registros ajudam a revelar seus padrões ao longo do tempo.";
  }
  if (daysThisWeek >= 6) {
    return hasReminders
      ? "Você registrou todos os dias desta semana e seus lembretes estão ativos."
      : "Você registrou todos os dias desta semana — presença constante.";
  }
  if (daysThisWeek >= 4) {
    return `${daysThisWeek} registros esta semana — padrões começam a ficar mais claros.`;
  }
  if (daysThisWeek === 1) {
    return "Primeiro registro da semana — cada presença conta.";
  }
  if (daysThisWeek === 2) {
    return "Dois registros nesta semana — a continuidade já começa a tomar forma.";
  }
  return `${daysThisWeek} registros nesta semana.`;
}

export function InsightsStrip({
  daysThisWeek,
  activeMedicationsCount,
  activeRemindersCount,
}: InsightsStripProps) {
  return (
    <p
      className="px-1 text-[15px] leading-relaxed text-foreground/65"
      style={{ letterSpacing: "-0.004em" }}
      aria-label="Resumo de atividade"
    >
      {getContextSentence(daysThisWeek, activeMedicationsCount, activeRemindersCount)}
    </p>
  );
}
