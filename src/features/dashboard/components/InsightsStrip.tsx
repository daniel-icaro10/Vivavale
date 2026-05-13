interface InsightsStripProps {
  daysThisWeek: number;
  activeMedicationsCount: number;
  activeRemindersCount: number;
}

function StatCell({
  value,
  label,
  context,
}: {
  value: number;
  label: string;
  context?: string;
}) {
  return (
    <div
      className="flex flex-col items-center gap-1 py-4 text-center"
      aria-label={`${value} ${label}`}
    >
      <span className="text-3xl font-semibold tabular-nums leading-none text-foreground">
        {value}
      </span>
      <span className="text-[11px] font-medium leading-tight text-muted-foreground">
        {label}
      </span>
      {context && (
        <span className="text-[10px] leading-tight text-muted-foreground/50 font-medium uppercase tracking-wide mt-0.5">
          {context}
        </span>
      )}
    </div>
  );
}

function plural(n: number, singular: string, plural: string): string {
  return n === 1 ? singular : plural;
}

function weekContext(days: number): string {
  if (days === 7) return "semana completa";
  if (days >= 5) return "boa frequência";
  if (days >= 3) return "em andamento";
  if (days === 1) return "bom começo";
  return "";
}

export function InsightsStrip({
  daysThisWeek,
  activeMedicationsCount,
  activeRemindersCount,
}: InsightsStripProps) {
  return (
    <div
      className="grid grid-cols-3 rounded-2xl bg-card shadow-card overflow-hidden"
      style={{ border: "1px solid oklch(0.928 0.010 85)" }}
      aria-label="Resumo de atividade"
    >
      <StatCell
        value={daysThisWeek}
        label={plural(daysThisWeek, "dia esta semana", "dias esta semana")}
        context={weekContext(daysThisWeek)}
      />
      {/* Separadores verticais sutis */}
      <div className="relative">
        <div aria-hidden="true" className="absolute inset-y-4 left-0 w-px bg-border" />
        <StatCell
          value={activeMedicationsCount}
          label={plural(activeMedicationsCount, "remédio ativo", "remédios ativos")}
        />
        <div aria-hidden="true" className="absolute inset-y-4 right-0 w-px bg-border" />
      </div>
      <StatCell
        value={activeRemindersCount}
        label={plural(activeRemindersCount, "lembrete ativo", "lembretes ativos")}
      />
    </div>
  );
}
