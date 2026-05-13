function SkeletonCard({ timeWidth }: { timeWidth: number }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-4">
      {/* Horário — destaque */}
      <div className="flex items-start justify-between gap-3">
        <div className="h-7 rounded bg-muted" style={{ width: timeWidth }} />
      </div>
      {/* Medicamento */}
      <div className="mt-1.5 h-4 w-32 rounded bg-muted" />
      {/* Recorrência */}
      <div className="mt-1 h-3 w-20 rounded bg-muted" />
      {/* Botões */}
      <div className="mt-4 flex gap-1.5">
        <div className="h-11 flex-1 rounded-lg bg-muted" />
        <div className="h-11 flex-1 rounded-lg bg-muted" />
        <div className="h-11 flex-1 rounded-lg bg-muted" />
      </div>
    </div>
  );
}

const TIME_WIDTHS = [56, 56, 56, 56];

export default function RemindersLoading() {
  return (
    <div role="status" aria-label="Carregando lembretes">
      <p className="sr-only">Carregando...</p>

      <div aria-hidden="true" className="animate-pulse">
        {/* PageHeader */}
        <div className="mb-6">
          <div className="h-6 w-24 rounded-md bg-muted" />
          <div className="mt-1 h-4 w-56 rounded bg-muted" />
        </div>

        {/* Cards */}
        <div className="space-y-3">
          {TIME_WIDTHS.map((w, i) => (
            <SkeletonCard key={i} timeWidth={w} />
          ))}
        </div>
      </div>
    </div>
  );
}
