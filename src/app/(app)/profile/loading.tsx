export default function ProfileLoading() {
  return (
    <div role="status" aria-label="Carregando perfil">
      <p className="sr-only">Carregando...</p>

      {/* PageHeader */}
      <div className="mb-8" aria-hidden="true">
        <div className="h-7 w-16 rounded-lg vl-shimmer" />
      </div>

      <div className="space-y-10" aria-hidden="true">
        {/* Seção: Sobre você */}
        <div className="space-y-4">
          <div className="h-2 w-16 rounded-full vl-shimmer" />
          <div className="space-y-3">
            <div className="h-4 w-12 rounded vl-shimmer" />
            <div className="h-10 w-full rounded-lg vl-shimmer" style={{ animationDelay: "30ms" }} />
          </div>
          <div className="space-y-3">
            <div className="h-4 w-24 rounded vl-shimmer" />
            <div className="h-10 w-full rounded-lg vl-shimmer" style={{ animationDelay: "30ms" }} />
          </div>
          <div className="h-11 w-full rounded-lg vl-shimmer" style={{ animationDelay: "60ms" }} />
        </div>

        <div className="h-px bg-border/50" />

        {/* Seção: Lembretes */}
        <div className="space-y-4">
          <div className="h-2 w-20 rounded-full vl-shimmer" />
          <div className="h-11 w-full rounded-lg vl-shimmer" style={{ animationDelay: "30ms" }} />
        </div>

        <div className="h-px bg-border/50" />

        {/* Seção: Seus dados */}
        <div className="space-y-4">
          <div className="h-2 w-20 rounded-full vl-shimmer" />
          <div className="h-11 w-full rounded-lg vl-shimmer" style={{ animationDelay: "30ms" }} />
          <div className="h-11 w-full rounded-lg vl-shimmer" style={{ animationDelay: "60ms" }} />
        </div>

        <div className="h-px bg-border/50" />

        <div className="h-11 w-full rounded-lg vl-shimmer" />
      </div>
    </div>
  );
}
