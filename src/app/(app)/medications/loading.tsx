function SkeletonCard({ nameWidth }: { nameWidth: number }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-4">
      {/* Nome + badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="h-5 rounded bg-muted" style={{ width: nameWidth }} />
        <div className="h-5 w-14 rounded-full bg-muted" />
      </div>
      {/* Dose · frequência */}
      <div className="mt-1.5 h-4 w-28 rounded bg-muted" />
      {/* Data de início */}
      <div className="mt-1 h-3 w-24 rounded bg-muted" />
      {/* Botões */}
      <div className="mt-4 flex gap-2">
        <div className="h-11 flex-1 rounded-lg bg-muted" />
        <div className="h-11 flex-1 rounded-lg bg-muted" />
      </div>
    </div>
  );
}

const NAME_WIDTHS = [144, 104, 168, 88, 128];

export default function MedicationsLoading() {
  return (
    <div role="status" aria-label="Carregando medicamentos">
      <p className="sr-only">Carregando...</p>

      <div aria-hidden="true" className="animate-pulse">
        {/* PageHeader */}
        <div className="mb-6">
          <div className="h-6 w-20 rounded-md bg-muted" />
          <div className="mt-1 h-4 w-52 rounded bg-muted" />
        </div>

        {/* Cards */}
        <div className="space-y-3">
          {NAME_WIDTHS.map((w, i) => (
            <SkeletonCard key={i} nameWidth={w} />
          ))}
        </div>
      </div>
    </div>
  );
}
