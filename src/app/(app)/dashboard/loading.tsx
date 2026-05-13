export default function DashboardLoading() {
  return (
    <div
      role="status"
      aria-label="Carregando início"
      className="animate-pulse"
    >
      <p className="sr-only">Carregando...</p>

      {/* PageHeader skeleton */}
      <div className="mb-6" aria-hidden="true">
        <div className="h-6 w-32 rounded-md bg-muted" />
        <div className="mt-1 h-4 w-52 rounded bg-muted" />
      </div>

      {/* Cards skeleton */}
      <div className="space-y-3" aria-hidden="true">
        {/* TodayCard ou OnboardingChecklist */}
        <div className="h-20 rounded-xl bg-muted" />

        {/* InsightsStrip */}
        <div className="grid grid-cols-3 divide-x divide-border rounded-xl border border-border bg-card">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1 py-3.5">
              <div className="h-7 w-8 rounded bg-muted" />
              <div className="h-3 w-16 rounded bg-muted" />
            </div>
          ))}
        </div>

        {/* Profile link */}
        <div className="h-[72px] rounded-xl bg-muted" />
      </div>
    </div>
  );
}
