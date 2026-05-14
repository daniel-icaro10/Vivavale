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

function ScoreDot({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-0.5" aria-label={`${label}: ${value}`}>
      <span className="text-sm tabular-nums leading-none text-muted-foreground/65">{value}</span>
      <span className="text-[10px] text-muted-foreground/40">{label}</span>
    </div>
  );
}

export function TodayCard({ todayLog }: TodayCardProps) {
  if (todayLog) {
    return (
      // Sem border — shadow-card + surface branca sobre fundo quente criam depth natural
      <div className="rounded-2xl bg-card px-5 py-5 shadow-card">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">Hoje</p>
            <span className="h-1.5 w-1.5 rounded-full bg-primary/45" aria-hidden="true" />
          </div>
          <Link
            href="/daily"
            className="text-xs font-medium text-primary/80 hover:text-primary transition-colors min-h-[44px] flex items-center"
            aria-label="Atualizar registro de hoje"
          >
            Atualizar
          </Link>
        </div>
        <p className="mb-4 text-[15px] leading-relaxed text-foreground/75" style={{ letterSpacing: "-0.004em" }}>
          {getDayNarrative(todayLog)}
        </p>
        <div className="flex gap-6">
          <ScoreDot label="Dor" value={todayLog.pain_level} />
          <ScoreDot label="Fadiga" value={todayLog.fatigue_level} />
          <ScoreDot label="Humor" value={todayLog.mood_level} />
        </div>
      </div>
    );
  }

  return (
    <Link
      href="/daily"
      className="group block rounded-2xl px-5 py-6 transition-all duration-200 hover:shadow-hover active:scale-[0.985]"
      style={{
        background: "oklch(0.545 0.155 277 / 0.05)",
        border: "1px solid oklch(0.545 0.155 277 / 0.13)",
        boxShadow: "0 1px 3px oklch(0.545 0.155 277 / 0.05)",
      }}
      aria-label="Registrar sintomas de hoje"
    >
      <p className="text-base font-semibold text-foreground" style={{ letterSpacing: "-0.015em" }}>
        Como está seu corpo hoje?
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground/80">
        Reserve um momento para você.
      </p>
      <p className="mt-4 text-xs font-medium text-primary/80 group-hover:text-primary transition-colors">
        Registrar →
      </p>
    </Link>
  );
}
