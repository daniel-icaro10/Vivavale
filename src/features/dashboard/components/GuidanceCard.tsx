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
        style={{ border: "1px solid oklch(0.928 0.010 85)" }}
        role="note"
        aria-label="Sugestão: configure lembretes"
      >
        <p className="text-sm font-semibold text-foreground">
          Quer lembretes gentis?
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Seus remédios estão cadastrados. Lembretes ajudam a manter a rotina sem esforço.
        </p>
        <Link
          href="/reminders"
          className="mt-4 inline-flex min-h-[44px] items-center text-sm font-semibold text-primary hover:opacity-75 transition-opacity"
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
        style={{ border: "1px solid oklch(0.928 0.010 85)" }}
        role="note"
        aria-label="Sugestão: registre seus sintomas"
      >
        <p className="text-sm font-semibold text-foreground">
          Registros revelam padrões
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Você ainda não anotou esta semana. Alguns minutos por dia constroem uma visão muito útil da sua evolução.
        </p>
        <Link
          href="/daily"
          className="mt-4 inline-flex min-h-[44px] items-center text-sm font-semibold text-primary hover:opacity-75 transition-opacity"
        >
          Anotar agora →
        </Link>
      </div>
    );
  }

  return null;
}
