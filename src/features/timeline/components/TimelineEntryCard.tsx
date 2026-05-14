import type { DailyLog } from "@/types/app";

const NOTE_DROPCAP_THRESHOLD = 120;
const NOTE_REFLECTIVE_THRESHOLD = 200;

function MetricBar({
  label,
  value,
  max = 10,
}: {
  label: string;
  value: number;
  max?: number;
}) {
  const pct = Math.round((value / max) * 100);
  return (
    <div
      className="flex items-center gap-3"
      role="group"
      aria-label={`${label}: ${value} de ${max}`}
    >
      <span className="w-14 shrink-0 text-[11px] text-muted-foreground/40">
        {label}
      </span>
      <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-border/30">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-primary/18"
          style={{ width: `${pct}%` }}
          aria-hidden="true"
        />
      </div>
      <span
        className="w-4 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground/40"
        aria-hidden="true"
      >
        {value}
      </span>
    </div>
  );
}

export function TimelineEntryCard({
  log,
  metricsOpacity = 1,
}: {
  log: DailyLog;
  metricsOpacity?: number;
}) {
  const noteLength = log.notes?.length ?? 0;
  const isLongNote = noteLength >= NOTE_DROPCAP_THRESHOLD;
  const isReflective = noteLength >= NOTE_REFLECTIVE_THRESHOLD;
  const paragraphs = log.notes?.split("\n").filter((p) => p.trim().length > 0) ?? [];

  return (
    <div className="pl-1 space-y-4">
      {log.notes && (
        <div
          className={`pl-4 ${isReflective ? "py-2" : "py-0.5"}`}
          style={{ borderLeft: "2px solid oklch(0.540 0.138 277 / 0.12)" }}
        >
          {paragraphs.length > 1 ? (
            paragraphs.map((para, i) => (
              <p
                key={i}
                className={`text-[15px] leading-[1.9] text-foreground/78 max-w-[62ch] ${
                  i > 0 ? "mt-3" : ""
                } ${i === 0 && isLongNote ? "vl-dropcap" : ""}`}
                style={{ letterSpacing: "-0.004em" }}
              >
                {para}
              </p>
            ))
          ) : (
            <p
              className={`text-[15px] leading-[1.9] text-foreground/78 max-w-[62ch] ${
                isLongNote ? "vl-dropcap" : ""
              }`}
              style={{ letterSpacing: "-0.004em" }}
            >
              {log.notes}
            </p>
          )}
        </div>
      )}
      <div className="space-y-2" style={{ opacity: metricsOpacity }}>
        <MetricBar label="Dor"       value={log.pain_level} />
        <MetricBar label="Fadiga"    value={log.fatigue_level} />
        <MetricBar label="Sono"      value={log.sleep_quality} />
        <MetricBar label="Humor"     value={log.mood_level} />
        <MetricBar label="Ansiedade" value={log.anxiety_level} />
      </div>
    </div>
  );
}
