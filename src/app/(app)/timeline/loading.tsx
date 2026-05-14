export default function TimelineLoading() {
  return (
    <div role="status" className="space-y-8">
      <p className="sr-only">Carregando evolução...</p>

      <div aria-hidden="true" className="space-y-8">
        {/* PageHeader skeleton */}
        <div className="mb-8 space-y-2">
          <div className="h-2.5 w-24 rounded-full vl-shimmer" />
          <div className="h-6 w-28 rounded-lg vl-shimmer" style={{ animationDelay: "60ms" }} />
        </div>

        {/* NarrativeCard skeleton — fundo quente */}
        <div
          className="rounded-2xl px-6 py-5 space-y-2.5"
          style={{
            background: "oklch(0.982 0.009 82)",
            borderTop: "2px solid oklch(0.540 0.138 277 / 0.06)",
            border: "1px solid oklch(0.944 0.007 82)",
          }}
        >
          <div className="h-2 w-16 rounded-full vl-shimmer" />
          <div className="h-4 w-full rounded vl-shimmer" style={{ animationDelay: "60ms" }} />
          <div className="h-4 w-5/6 rounded vl-shimmer" style={{ animationDelay: "80ms" }} />
          <div className="h-4 w-3/5 rounded vl-shimmer" style={{ animationDelay: "100ms" }} />
        </div>

        {/* WeeklySummaryCard skeleton */}
        <div
          className="rounded-2xl bg-card px-5 py-6 space-y-4"
          style={{ border: "1px solid oklch(0.940 0.007 85)" }}
        >
          <div className="space-y-1">
            <div className="h-2 w-20 rounded vl-shimmer" />
            <div className="h-5 w-32 rounded vl-shimmer" style={{ animationDelay: "40ms" }} />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full rounded vl-shimmer" style={{ animationDelay: "60ms" }} />
            <div className="h-4 w-4/5 rounded vl-shimmer" style={{ animationDelay: "80ms" }} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[0, 1].map((i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-2 w-8 rounded vl-shimmer" style={{ animationDelay: `${i * 40}ms` }} />
                <div className="h-12 rounded vl-shimmer" style={{ animationDelay: `${i * 40 + 20}ms` }} />
              </div>
            ))}
          </div>
        </div>

        {/* Day groups skeleton — journal style, sem cards */}
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-5">
            {/* Date label + separator */}
            <div className="flex items-center gap-3">
              <div className="h-2.5 w-24 rounded vl-shimmer" style={{ animationDelay: `${i * 80}ms` }} />
              <div className="h-px flex-1 bg-border/40" />
            </div>
            {/* Journal content — no card border */}
            <div className="pl-1 space-y-2.5">
              {i === 0 && (
                <div
                  className="pl-3 mb-3"
                  style={{ borderLeft: "2px solid oklch(0.540 0.138 277 / 0.08)" }}
                >
                  <div className="h-4 w-5/6 rounded vl-shimmer" />
                  <div className="mt-1.5 h-4 w-3/4 rounded vl-shimmer" style={{ animationDelay: "40ms" }} />
                </div>
              )}
              {[0, 1, 2, 3, 4].map((j) => (
                <div key={j} className="flex items-center gap-3">
                  <div className="h-2.5 w-12 rounded vl-shimmer" style={{ animationDelay: `${j * 20}ms` }} />
                  <div className="h-1 flex-1 rounded-full vl-shimmer" style={{ animationDelay: `${j * 20 + 10}ms` }} />
                  <div className="h-2.5 w-4 rounded vl-shimmer" style={{ animationDelay: `${j * 20 + 15}ms` }} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
