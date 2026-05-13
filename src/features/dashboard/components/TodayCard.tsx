import Link from "next/link";

interface TodayLog {
  pain_level: number;
  fatigue_level: number;
  mood_level: number;
}

interface TodayCardProps {
  todayLog: TodayLog | null;
}

export function TodayCard({ todayLog }: TodayCardProps) {
  if (todayLog) {
    return (
      <div className="rounded-xl border border-border bg-card px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Registro de hoje
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Dor {todayLog.pain_level} · Fadiga {todayLog.fatigue_level} ·
              Humor {todayLog.mood_level}
            </p>
          </div>
          <Link
            href="/daily"
            className="shrink-0 py-1 text-xs font-medium text-primary hover:underline"
            aria-label="Atualizar registro de hoje"
          >
            Atualizar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Link
      href="/daily"
      className="block rounded-xl border border-primary/25 bg-primary/5 px-4 py-4 transition-colors hover:bg-primary/10 active:bg-primary/15"
      aria-label="Registrar sintomas de hoje"
    >
      <p className="text-sm font-semibold text-foreground">
        Como você está hoje?
      </p>
      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
        Reserve um momento para registrar seus sintomas.
      </p>
    </Link>
  );
}
