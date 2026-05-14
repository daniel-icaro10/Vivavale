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
      ? "Esta semana ainda não tem momentos registrados."
      : "Cada registro ajuda a revelar seus padrões ao longo do tempo.";
  }
  if (daysThisWeek >= 6) {
    return hasReminders
      ? "Presença em todos os dias desta semana, com lembretes ativos."
      : "Presença em todos os dias desta semana.";
  }
  if (daysThisWeek >= 4) {
    return `${daysThisWeek} momentos registrados esta semana — os padrões ficam mais visíveis.`;
  }
  if (daysThisWeek === 1) {
    return "Primeiro momento desta semana registrado.";
  }
  if (daysThisWeek === 2) {
    return "Dois momentos registrados nesta semana.";
  }
  return `${daysThisWeek} momentos registrados esta semana.`;
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
