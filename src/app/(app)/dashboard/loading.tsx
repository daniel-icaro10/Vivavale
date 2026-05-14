export default function DashboardLoading() {
  return (
    <div
      role="status"
      aria-label="Carregando início"
      className="space-y-7"
    >
      <p className="sr-only">Carregando...</p>

      {/* Hero skeleton */}
      <div className="pb-3 space-y-2" aria-hidden="true">
        <div className="h-2.5 w-32 rounded-full vl-shimmer" />
        <div className="h-7 w-40 rounded-lg vl-shimmer" style={{ animationDelay: "80ms" }} />
        <div className="mt-1 h-4 w-60 rounded vl-shimmer" style={{ animationDelay: "160ms" }} />
      </div>

      {/* TodayCard skeleton — shadow only, sem border */}
      <div
        className="rounded-2xl bg-card px-5 py-5 shadow-card"
        aria-hidden="true"
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-10 rounded vl-shimmer" />
            <div className="h-1.5 w-1.5 rounded-full vl-shimmer" />
          </div>
          <div className="h-3.5 w-12 rounded vl-shimmer" />
        </div>
        <div className="mb-4 h-4 w-48 rounded vl-shimmer" style={{ animationDelay: "60ms" }} />
        <div className="flex gap-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="h-4 w-4 rounded vl-shimmer" style={{ animationDelay: `${i * 40}ms` }} />
              <div className="h-2.5 w-8 rounded vl-shimmer" style={{ animationDelay: `${i * 40 + 20}ms` }} />
            </div>
          ))}
        </div>
      </div>

      {/* InsightsStrip skeleton — texto observacional */}
      <div className="px-1 space-y-2" aria-hidden="true">
        <div className="h-2 w-20 rounded-full vl-shimmer" />
        <div className="h-4 w-52 rounded vl-shimmer" style={{ animationDelay: "40ms" }} />
        <div className="h-3 w-36 rounded vl-shimmer" style={{ animationDelay: "80ms" }} />
      </div>

      {/* Profile link skeleton — separador + linha minimal */}
      <div aria-hidden="true">
        <div className="h-px bg-border/40 mb-5" />
        <div className="flex items-center justify-between px-1 py-2">
          <div className="space-y-1.5">
            <div className="h-2 w-10 rounded vl-shimmer" />
            <div className="h-3.5 w-28 rounded vl-shimmer" style={{ animationDelay: "40ms" }} />
          </div>
          <div className="h-4 w-3 rounded vl-shimmer" />
        </div>
      </div>
    </div>
  );
}
