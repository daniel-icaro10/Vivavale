import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-4xl font-bold tabular-nums text-foreground">404</p>
      <p className="text-base font-semibold text-foreground">
        Página não encontrada
      </p>
      <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
        Esta página não existe ou foi movida.
      </p>
      <Link
        href="/dashboard"
        className="mt-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        Ir para o início
      </Link>
    </div>
  );
}
