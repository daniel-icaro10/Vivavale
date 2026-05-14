export default function DailyLoading() {
  return (
    <div role="status" aria-label="Carregando registro diário" className="space-y-6">
      <p className="sr-only">Carregando...</p>

      {/* Header */}
      <div className="pb-1 space-y-3" aria-hidden="true">
        <div className="h-2.5 w-28 rounded-full vl-shimmer" />
        <div className="h-7 w-48 rounded-lg vl-shimmer" style={{ animationDelay: "60ms" }} />
      </div>

      {/* Sintomas físicos */}
      <section aria-hidden="true" className="space-y-5">
        <div className="h-2.5 w-24 rounded-full vl-shimmer" />
        <div className="rounded-2xl bg-card px-5 py-5 shadow-card space-y-6">
          {[0, 1].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="h-3.5 w-16 rounded vl-shimmer" style={{ animationDelay: `${i * 40}ms` }} />
                <div className="h-4 w-5 rounded vl-shimmer" />
              </div>
              <div className="h-11 w-full rounded vl-shimmer" style={{ animationDelay: `${i * 40 + 20}ms` }} />
            </div>
          ))}
        </div>
      </section>

      {/* Bem-estar */}
      <section aria-hidden="true" className="space-y-5">
        <div className="h-2.5 w-20 rounded-full vl-shimmer" style={{ animationDelay: "80ms" }} />
        <div className="rounded-2xl bg-card px-5 py-5 shadow-card space-y-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="h-3.5 w-20 rounded vl-shimmer" style={{ animationDelay: `${i * 40 + 80}ms` }} />
                <div className="h-4 w-5 rounded vl-shimmer" />
              </div>
              <div className="h-11 w-full rounded vl-shimmer" style={{ animationDelay: `${i * 40 + 100}ms` }} />
            </div>
          ))}
        </div>
      </section>

      {/* Salvar */}
      <div className="space-y-3 pb-2" aria-hidden="true">
        <div className="min-h-10" />
        <div className="h-12 w-full rounded-xl vl-shimmer" style={{ animationDelay: "120ms" }} />
      </div>
    </div>
  );
}
