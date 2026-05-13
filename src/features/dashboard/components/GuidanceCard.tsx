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
        className="rounded-xl border border-border bg-card px-4 py-4"
        role="note"
        aria-label="Sugestão: configure lembretes"
      >
        <p className="text-sm font-medium text-foreground">
          Configure lembretes
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          Você tem remédios cadastrados. Lembretes ajudam a não esquecer de
          tomá-los.
        </p>
        <Link
          href="/reminders"
          className="mt-2 inline-flex min-h-[44px] items-center gap-1 py-2.5 text-xs font-medium text-primary hover:underline"
        >
          Configurar lembretes →
        </Link>
      </div>
    );
  }

  if (hasMedications && hasReminders && !hasLoggedThisWeek) {
    return (
      <div
        className="rounded-xl border border-border bg-card px-4 py-4"
        role="note"
        aria-label="Sugestão: registre seus sintomas"
      >
        <p className="text-sm font-medium text-foreground">
          Registros ajudam a ver padrões
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          Você ainda não registrou esta semana. Registros regulares ajudam a
          identificar padrões nos seus sintomas.
        </p>
        <Link
          href="/daily"
          className="mt-2 inline-flex min-h-[44px] items-center gap-1 py-2.5 text-xs font-medium text-primary hover:underline"
        >
          Registrar agora →
        </Link>
      </div>
    );
  }

  return null;
}
