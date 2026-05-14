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

      {/* TodayCard skeleton — editorial surface */}
      <div
        className="rounded-2xl bg-card px-6 py-7 shadow-card"
        aria-hidden="true"
      >
        <div className="h-2 w-8 rounded-full vl-shimmer mb-2" />
        <div className="h-5 w-52 rounded vl-shimmer" style={{ animationDelay: "40ms" }} />
        <div className="mt-5 flex items-center gap-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-baseline gap-1">
              <div className="h-2 w-7 rounded-full vl-shimmer" style={{ animationDelay: `${i * 30}ms` }} />
              <div className="h-3.5 w-4 rounded vl-shimmer" style={{ animationDelay: `${i * 30 + 15}ms` }} />
            </div>
          ))}
          <div className="ml-auto h-3 w-16 rounded vl-shimmer" style={{ animationDelay: "80ms" }} />
        </div>
      </div>

      {/* InsightsStrip skeleton — frase contextual única */}
      <div className="px-1" aria-hidden="true">
        <div className="h-4 w-64 rounded vl-shimmer" />
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
