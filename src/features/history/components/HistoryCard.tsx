import type { DailyLog } from "@/types/app";

const WEEKDAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const SYMPTOMS = [
  { key: "pain_level" as const, label: "Dor" },
  { key: "fatigue_level" as const, label: "Fadiga" },
  { key: "sleep_quality" as const, label: "Sono" },
  { key: "mood_level" as const, label: "Humor" },
  { key: "anxiety_level" as const, label: "Ansiedade" },
] as const;

function formatCardDate(dateStr: string): { weekday: string; date: string } {
  // Usa números para evitar comportamento UTC do parsing de string ISO
  const [yearStr, monthStr, dayStr] = dateStr.split("-");
  const d = new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr));
  return {
    weekday: WEEKDAYS_PT[d.getDay()],
    date: d.toLocaleDateString("pt-BR", { day: "numeric", month: "long" }),
  };
}

interface HistoryCardProps {
  log: DailyLog;
}

export function HistoryCard({ log }: HistoryCardProps) {
  const { weekday, date } = formatCardDate(log.date);

  return (
    <article
      aria-label={`${weekday}, ${date}`}
      className="rounded-xl border border-border bg-card px-4 py-4"
    >
      {/* Data como âncora visual principal */}
      <time dateTime={log.date} className="flex items-baseline gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          {weekday}
        </span>
        <span className="text-base font-semibold text-foreground">{date}</span>
      </time>

      {/* Sintomas — secundários, discretos */}
      <dl className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1">
        {SYMPTOMS.map(({ key, label }) => (
          <div key={key} className="flex items-baseline gap-1">
            <dt className="text-[11px] text-muted-foreground">{label}</dt>
            <dd className="text-xs font-semibold tabular-nums text-foreground/80">
              {log[key]}
            </dd>
          </div>
        ))}
      </dl>

      {/* Anotação — terciária, tom de memória pessoal */}
      {log.notes && (
        <p className="mt-3 line-clamp-2 text-xs italic leading-relaxed text-muted-foreground">
          {log.notes}
        </p>
      )}
    </article>
  );
}
