export default function DashboardLoading() {
  return (
    <div
      role="status"
      aria-label="Carregando início"
      className="space-y-5 animate-pulse"
    >
      <p className="sr-only">Carregando...</p>

      {/* Hero skeleton */}
      <div className="pb-1" aria-hidden="true">
        <div className="mb-2 h-3 w-36 rounded-full bg-muted" />
        <div className="h-7 w-44 rounded-lg bg-muted" />
        <div className="mt-2 h-4 w-56 rounded bg-muted/60" />
      </div>

      {/* TodayCard skeleton */}
      <div
        className="rounded-2xl bg-card px-5 py-5 shadow-xs"
        style={{ border: "1px solid oklch(0.928 0.010 85)" }}
        aria-hidden="true"
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-4 w-10 rounded bg-muted" />
            <div className="h-1.5 w-1.5 rounded-full bg-muted" />
          </div>
          <div className="h-4 w-14 rounded bg-muted" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div className="h-7 w-8 rounded bg-muted" />
              <div className="h-3 w-10 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>

      {/* InsightsStrip skeleton */}
      <div
        className="grid grid-cols-3 overflow-hidden rounded-2xl bg-card"
        style={{ border: "1px solid oklch(0.928 0.010 85)" }}
        aria-hidden="true"
      >
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 py-4">
            <div className="h-8 w-8 rounded bg-muted" />
            <div className="h-3 w-20 rounded bg-muted" />
          </div>
        ))}
      </div>

      {/* Profile link skeleton */}
      <div
        className="flex items-center justify-between rounded-2xl bg-card px-5 py-4"
        style={{ border: "1px solid oklch(0.928 0.010 85)" }}
        aria-hidden="true"
      >
        <div className="space-y-1.5">
          <div className="h-4 w-12 rounded bg-muted" />
          <div className="h-3 w-28 rounded bg-muted" />
        </div>
        <div className="h-5 w-3 rounded bg-muted" />
      </div>
    </div>
  );
}
