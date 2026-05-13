export default function ProfileLoading() {
  return (
    <div role="status" aria-label="Carregando perfil" className="animate-pulse">
      <p className="sr-only">Carregando...</p>

      {/* PageHeader skeleton */}
      <div className="mb-6" aria-hidden="true">
        <div className="h-6 w-20 rounded-md bg-muted" />
        <div className="mt-1 h-4 w-40 rounded bg-muted" />
      </div>

      {/* Form fields */}
      <div className="space-y-6" aria-hidden="true">
        <div className="space-y-2">
          <div className="h-4 w-12 rounded bg-muted" />
          <div className="h-10 w-full rounded-lg bg-muted" />
        </div>

        <div className="space-y-2">
          <div className="h-4 w-24 rounded bg-muted" />
          <div className="h-3 w-56 rounded bg-muted" />
          <div className="h-10 w-full rounded-lg bg-muted" />
        </div>

        <div className="h-11 w-full rounded-lg bg-muted" />
      </div>

      {/* Logout separator */}
      <div className="mt-8 border-t border-border pt-8" aria-hidden="true">
        <div className="h-11 w-full rounded-lg bg-muted" />
      </div>
    </div>
  );
}
