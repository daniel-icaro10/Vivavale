import Link from "next/link";

interface GuidanceCardProps {
  hasMedications: boolean;
  hasReminders: boolean;
  hasLoggedThisWeek: boolean;
}

export function GuidanceCard({
  hasMedications,
  hasReminders,
  hasLoggedThisWeek,
}: GuidanceCardProps) {
  if (hasMedications && !hasReminders) {
    return (
      <div
        className="rounded-2xl bg-card px-5 py-5 shadow-xs"
        style={{ border: "1px solid oklch(0.940 0.007 85)" }}
        role="note"
        aria-label="Sugestão: configure lembretes"
      >
        <p className="text-sm font-semibold text-foreground">
          Lembretes ajudam a manter a rotina.
        </p>
        <Link
          href="/reminders"
          className="mt-3 inline-flex min-h-[44px] items-center text-sm font-semibold text-primary hover:opacity-75 transition-opacity"
        >
          Configurar lembretes →
        </Link>
      </div>
    );
  }

  if (hasMedications && hasReminders && !hasLoggedThisWeek) {
    return (
      <div
        className="rounded-2xl bg-card px-5 py-5 shadow-xs"
        style={{ border: "1px solid oklch(0.940 0.007 85)" }}
        role="note"
        aria-label="Sugestão: registre seus sintomas"
      >
        <p className="text-sm font-semibold text-foreground">
          Registrar regularmente revela padrões.
        </p>
        <Link
          href="/daily"
          className="mt-3 inline-flex min-h-[44px] items-center text-sm font-semibold text-primary hover:opacity-75 transition-opacity"
        >
          Registrar hoje →
        </Link>
      </div>
    );
  }

  return null;
}
