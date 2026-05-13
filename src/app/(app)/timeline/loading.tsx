export default function TimelineLoading() {
  return (
    <div role="status" className="space-y-6">
      <p className="sr-only">Carregando evolução...</p>

      <div aria-hidden="true" className="animate-pulse space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="h-4 w-28 rounded-md bg-muted" />
          <div className="h-7 w-48 rounded-md bg-muted" />
        </div>

        {/* Weekly summary card */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-4 w-40 rounded bg-muted" />
            <div className="h-4 w-10 rounded bg-muted" />
          </div>
          <div className="h-3 w-full rounded bg-muted" />
          <div className="h-3 w-3/4 rounded bg-muted" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-12 rounded bg-muted" />
            <div className="h-12 rounded bg-muted" />
          </div>
        </div>

        {/* Day groups */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3">
            <div className="h-3 w-36 rounded bg-muted" />
            <div className="rounded-xl border border-border bg-card p-4 space-y-2.5">
              {[1, 2, 3, 4, 5].map((j) => (
                <div key={j} className="flex items-center gap-2">
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
