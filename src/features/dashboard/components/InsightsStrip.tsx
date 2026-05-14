interface InsightsStripProps {
  daysThisWeek: number;
  activeMedicationsCount: number;
  activeRemindersCount: number;
}

function getWeekObservation(days: number): string {
  if (days === 0) return "Esta semana ainda não tem registros.";
  if (days === 1) return "Um registro nesta semana.";
  if (days <= 3) return `${days} dias registrados esta semana.`;
  if (days <= 5) return `${days} dias esta semana — um ritmo consistente.`;
  return `${days} dias esta semana — presença constante.`;
}

export function InsightsStrip({
  daysThisWeek,
  activeMedicationsCount,
  activeRemindersCount,
}: InsightsStripProps) {
  const remText =
    activeRemindersCount > 0
      ? ` · ${activeRemindersCount === 1 ? "1 lembrete" : `${activeRemindersCount} lembretes`}`
      : "";

  return (
    <div className="px-1 space-y-1.5" aria-label="Resumo de atividade">
      <p className="vl-eyebrow">Esta semana</p>
      <p
        className="text-[15px] leading-relaxed text-foreground/75"
        style={{ letterSpacing: "-0.004em" }}
      >
        {getWeekObservation(daysThisWeek)}
      </p>
      {activeMedicationsCount > 0 && (
        <p className="vl-metric">
          {activeMedicationsCount === 1
            ? "1 remédio ativo"
            : `${activeMedicationsCount} remédios ativos`}
          {remText}
        </p>
      )}
    </div>
  );
}
