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
        role="note"
        aria-label="Sugestão: configure lembretes"
        className="py-2"
      >
        <p className="vl-eyebrow mb-3">Sugestão</p>
        <p
          className="text-[15px] leading-relaxed text-foreground/75"
          style={{ letterSpacing: "-0.004em" }}
        >
          Lembretes ajudam a manter a rotina sem esforço extra.
        </p>
        <Link
          href="/reminders"
          className="mt-4 inline-flex min-h-[44px] items-center text-sm font-medium text-primary/80 hover:text-primary transition-colors"
        >
          Configurar lembretes →
        </Link>
      </div>
    );
  }

  if (hasMedications && hasReminders && !hasLoggedThisWeek) {
    return (
      <div
        role="note"
        aria-label="Sugestão: registre seus sintomas"
        className="py-2"
      >
        <p className="vl-eyebrow mb-3">Esta semana</p>
        <p
          className="text-[15px] leading-relaxed text-foreground/75"
          style={{ letterSpacing: "-0.004em" }}
        >
          Registrar regularmente revela padrões que o dia a dia esconde.
        </p>
        <Link
          href="/daily"
          className="mt-4 inline-flex min-h-[44px] items-center text-sm font-medium text-primary/80 hover:text-primary transition-colors"
        >
          Registrar hoje →
        </Link>
      </div>
    );
  }

  return null;
}
