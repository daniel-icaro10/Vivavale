interface InsightsStripProps {
  daysThisWeek: number;
  activeMedicationsCount: number;
  activeRemindersCount: number;
}

function InsightCell({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div
      className="flex flex-col items-center gap-0.5 px-2 py-3.5 text-center"
      aria-label={`${value} ${label}`}
    >
      <span className="text-2xl font-bold tabular-nums leading-none text-foreground">
        {value}
      </span>
      <span className="mt-1 text-[11px] leading-tight text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function plural(n: number, singular: string, plural: string): string {
  return n === 1 ? singular : plural;
}

export function InsightsStrip({
  daysThisWeek,
  activeMedicationsCount,
  activeRemindersCount,
}: InsightsStripProps) {
  return (
    <div
      className="grid grid-cols-3 divide-x divide-border rounded-xl border border-border bg-card"
      aria-label="Resumo de atividade"
    >
      <InsightCell
        value={daysThisWeek}
        label={plural(daysThisWeek, "dia esta semana", "dias esta semana")}
      />
      <InsightCell
        value={activeMedicationsCount}
        label={plural(
          activeMedicationsCount,
          "remédio ativo",
          "remédios ativos",
        )}
      />
      <InsightCell
        value={activeRemindersCount}
        label={plural(
          activeRemindersCount,
          "lembrete ativo",
          "lembretes ativos",
        )}
      />
    </div>
  );
}
