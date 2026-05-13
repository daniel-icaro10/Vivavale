// Larguras dos blocos de sintoma em px, correspondentes a:
// Dor, Fadiga, Sono, Humor, Ansiedade
const SYMPTOM_WIDTHS = [28, 38, 30, 34, 50];

function SkeletonCard({ hasNotes }: { hasNotes: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-4">
      {/* Weekday + data */}
      <div className="flex items-baseline gap-2">
        <div className="h-3 w-7 rounded bg-muted" />
        <div className="h-5 w-32 rounded bg-muted" />
      </div>

      {/* Sintomas */}
      <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1">
        {SYMPTOM_WIDTHS.map((w, i) => (
          <div key={i} className="h-3.5 rounded bg-muted" style={{ width: w }} />
        ))}
      </div>

      {/* Anotação */}
      {hasNotes && <div className="mt-3 h-3 w-3/4 rounded bg-muted" />}
    </div>
  );
}

function SkeletonGroup({
  headerWidth,
  cards,
}: {
  headerWidth: number;
  cards: boolean[]; // true = card com notes
}) {
  return (
    <div>
      {/* MonthHeader */}
      <div className="mb-4 border-b border-border pb-2">
        <div className="h-4 rounded bg-muted" style={{ width: headerWidth }} />
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {cards.map((hasNotes, i) => (
          <SkeletonCard key={i} hasNotes={hasNotes} />
        ))}
      </div>
    </div>
  );
}

export default function HistoryLoading() {
  return (
    <div role="status" aria-label="Carregando histórico">
      <p className="sr-only">Carregando...</p>

      <div aria-hidden="true" className="animate-pulse">
        {/* PageHeader */}
        <div className="mb-6">
          <div className="h-6 w-20 rounded-md bg-muted" />
          <div className="mt-1 h-4 w-56 rounded bg-muted" />
        </div>

        {/* Grupos de mês */}
        <div className="space-y-10">
          <SkeletonGroup
            headerWidth={72}
            cards={[true, true, false]}
          />
          <SkeletonGroup
            headerWidth={80}
            cards={[true, false]}
          />
        </div>
      </div>
    </div>
  );
}
