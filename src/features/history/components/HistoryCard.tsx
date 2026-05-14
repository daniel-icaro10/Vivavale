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
    <article aria-label={`${weekday}, ${date}`} className="py-4">
      <time dateTime={log.date} className="flex items-baseline gap-2.5 mb-2.5">
        <span className="vl-eyebrow capitalize">{weekday}</span>
        <span className="text-[13px] font-semibold text-foreground/85">{date}</span>
      </time>

      <dl className="flex flex-wrap gap-x-4 gap-y-1">
        {SYMPTOMS.map(({ key, label }) => (
          <div key={key} className="flex items-baseline gap-1">
            <dt className="text-[10px] text-muted-foreground/50">{label}</dt>
            <dd className="text-[12px] tabular-nums font-medium text-foreground/65">
              {log[key]}
            </dd>
          </div>
        ))}
      </dl>

      {log.notes && (
        <p
          className="mt-3 text-[13px] leading-relaxed text-muted-foreground/70 italic pl-4"
          style={{ borderLeft: "2px solid oklch(0.540 0.138 277 / 0.12)" }}
        >
          {log.notes}
        </p>
      )}
    </article>
  );
}
