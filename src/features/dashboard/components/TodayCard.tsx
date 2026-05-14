import Link from "next/link";

interface TodayLog {
  pain_level: number;
  fatigue_level: number;
  mood_level: number;
}

interface TodayCardProps {
  todayLog: TodayLog | null;
}

function getDayNarrative(log: TodayLog): string {
  const { pain_level, fatigue_level, mood_level } = log;
  if (pain_level <= 3 && fatigue_level <= 3) return "Um dia mais leve.";
  if (pain_level >= 7 || fatigue_level >= 7) return "Um dia mais pesado.";
  if (mood_level >= 7) return "O humor ajudou hoje.";
  if (mood_level <= 3) return "Um dia difícil pelo lado emocional.";
  return "Um dia equilibrado.";
}

function MetricInline({ label, value }: { label: string; value: number }) {
  return (
    <span
      className="inline-flex items-baseline gap-1"
      aria-label={`${label}: ${value}`}
    >
      <span className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground/35">
        {label}
      </span>
      <span className="text-sm tabular-nums text-foreground/55">{value}</span>
    </span>
  );
}

export function TodayCard({ todayLog }: TodayCardProps) {
  if (todayLog) {
    return (
      <div className="rounded-2xl bg-card px-6 py-7 shadow-card">
        <p className="vl-eyebrow mb-2">Hoje</p>
        <p
          className="text-[16px] leading-[1.85] text-foreground/80 max-w-reading"
          style={{ letterSpacing: "-0.004em" }}
        >
          {getDayNarrative(todayLog)}
        </p>
        <div className="mt-5 flex items-center gap-5">
          <MetricInline label="Dor" value={todayLog.pain_level} />
          <MetricInline label="Fadiga" value={todayLog.fatigue_level} />
          <MetricInline label="Humor" value={todayLog.mood_level} />
          <Link
            href="/daily"
            className="ml-auto text-xs font-medium text-primary/65 hover:text-primary transition-colors"
            aria-label="Atualizar registro de hoje"
          >
            Atualizar →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Link
      href="/daily"
      className="group block rounded-2xl px-6 py-7 transition-all duration-200 hover:shadow-hover active:scale-[0.985]"
      style={{
        background: "oklch(0.545 0.155 277 / 0.05)",
        border: "1px solid oklch(0.545 0.155 277 / 0.12)",
      }}
      aria-label="Registrar sintomas de hoje"
    >
      <p
        className="text-[16px] font-semibold text-foreground"
        style={{ letterSpacing: "-0.018em" }}
      >
        Como está seu corpo hoje?
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground/70">
        Reserve um momento para você.
      </p>
      <p className="mt-5 text-xs font-medium text-primary/70 group-hover:text-primary transition-colors">
        Registrar →
      </p>
    </Link>
  );
}
