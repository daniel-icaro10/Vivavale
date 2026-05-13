import Link from "next/link";

interface TodayLog {
  pain_level: number;
  fatigue_level: number;
  mood_level: number;
}

interface TodayCardProps {
  todayLog: TodayLog | null;
}

function ScorePill({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-xl font-semibold tabular-nums leading-none text-foreground">
        {value}
      </span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}

export function TodayCard({ todayLog }: TodayCardProps) {
  if (todayLog) {
    return (
      <div
        className="rounded-2xl bg-card px-5 py-5 shadow-card float-hover"
        style={{ border: "1px solid oklch(0.928 0.010 85)" }}
      >
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">Hoje</p>
            <span
              className="h-1.5 w-1.5 rounded-full bg-primary/60"
              aria-hidden="true"
            />
          </div>
          <Link
            href="/daily"
            className="text-xs font-medium text-primary hover:opacity-75 transition-opacity min-h-[44px] flex items-center"
            aria-label="Atualizar registro de hoje"
          >
            Atualizar
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <ScorePill label="Dor" value={todayLog.pain_level} />
          <ScorePill label="Fadiga" value={todayLog.fatigue_level} />
          <ScorePill label="Humor" value={todayLog.mood_level} />
        </div>
      </div>
    );
  }

  return (
    <Link
      href="/daily"
      className="group block rounded-2xl px-5 py-6 transition-all duration-200 hover:shadow-hover active:scale-[0.985]"
      style={{
        background: "oklch(0.545 0.155 277 / 0.06)",
        border: "1px solid oklch(0.545 0.155 277 / 0.18)",
        boxShadow: "0 1px 3px oklch(0.545 0.155 277 / 0.08)",
      }}
      aria-label="Registrar sintomas de hoje"
    >
      <p className="text-base font-semibold text-foreground leading-snug">
        Como está seu corpo hoje?
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        Reserve um momento para anotar seus sintomas.
      </p>
      <p className="mt-4 text-xs font-semibold text-primary group-hover:underline">
        Registrar agora →
      </p>
    </Link>
  );
}
