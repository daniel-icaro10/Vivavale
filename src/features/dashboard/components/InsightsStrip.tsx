interface InsightsStripProps {
  daysThisWeek: number;
  activeMedicationsCount: number;
  activeRemindersCount: number;
}

function StatCell({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div
      className="flex flex-col items-center gap-1 py-4 text-center"
      aria-label={`${value} ${label}`}
    >
      <span className="text-2xl font-semibold tabular-nums leading-none text-foreground">
        {value}
      </span>
      <span className="text-[11px] font-medium leading-tight text-muted-foreground/70">
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
      className="grid grid-cols-3 rounded-2xl bg-card shadow-xs overflow-hidden"
      style={{ border: "1px solid oklch(0.940 0.007 85)" }}
      aria-label="Resumo de atividade"
    >
      <StatCell
        value={daysThisWeek}
        label={plural(daysThisWeek, "dia esta semana", "dias esta semana")}
      />
      <div className="relative">
        <div aria-hidden="true" className="absolute inset-y-4 left-0 w-px bg-border/60" />
        <StatCell
          value={activeMedicationsCount}
          label={plural(activeMedicationsCount, "remédio", "remédios")}
        />
        <div aria-hidden="true" className="absolute inset-y-4 right-0 w-px bg-border/60" />
      </div>
      <StatCell
        value={activeRemindersCount}
        label={plural(activeRemindersCount, "lembrete", "lembretes")}
      />
    </div>
  );
}
