export default function TimelineLoading() {
  return (
    <div role="status" className="space-y-6">
      <p className="sr-only">Carregando evolução...</p>

      <div aria-hidden="true" className="animate-pulse space-y-6">
        {/* PageHeader skeleton */}
        <div className="space-y-1.5">
          <div className="h-3 w-28 rounded-full bg-muted" />
          <div className="h-6 w-32 rounded-lg bg-muted" />
        </div>

        {/* NarrativeCard skeleton */}
        <div
          className="rounded-2xl bg-card px-6 py-6 space-y-3"
          style={{ border: "1px solid oklch(0.928 0.010 85)" }}
        >
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-5/6 rounded bg-muted" />
          <div className="h-4 w-4/6 rounded bg-muted" />
        </div>

        {/* WeeklySummaryCard skeleton */}
        <div
          className="rounded-2xl bg-card px-5 py-6 space-y-4"
          style={{ border: "1px solid oklch(0.928 0.010 85)" }}
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="h-2.5 w-12 rounded bg-muted" />
              <div className="h-5 w-28 rounded bg-muted" />
            </div>
            <div className="h-6 w-12 rounded-full bg-muted" />
          </div>
          <div className="space-y-1.5">
            <div className="h-4 w-full rounded bg-muted" />
            <div className="h-4 w-4/5 rounded bg-muted" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="h-2.5 w-8 rounded bg-muted" />
              <div className="h-14 rounded bg-muted" />
            </div>
            <div className="space-y-1.5">
              <div className="h-2.5 w-8 rounded bg-muted" />
              <div className="h-14 rounded bg-muted" />
            </div>
          </div>
        </div>

        {/* Separador "Dias" */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <div className="h-2.5 w-8 rounded bg-muted" />
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Day groups skeleton */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3">
            <div className="h-3 w-32 rounded bg-muted" />
            <div
              className="rounded-2xl bg-card px-5 py-5 space-y-3"
              style={{ border: "1px solid oklch(0.928 0.010 85)" }}
            >
              {[1, 2, 3, 4, 5].map((j) => (
                <div key={j} className="flex items-center gap-3">
                  <div className="h-3 w-14 rounded bg-muted" />
                  <div className="h-1.5 flex-1 rounded-full bg-muted" />
                  <div className="h-3 w-5 rounded bg-muted" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
