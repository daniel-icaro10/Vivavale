interface DailyLogHeaderProps {
  date: Date;
  hasExistingLog: boolean;
}

export function DailyLogHeader({ date, hasExistingLog }: DailyLogHeaderProps) {
  const formatted = date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="pb-1">
      <p className="vl-eyebrow mb-3 capitalize" suppressHydrationWarning>
        {formatted}
      </p>
      <h1
        className="text-2xl font-semibold text-foreground"
        style={{ letterSpacing: "-0.025em", lineHeight: 1.2 }}
      >
        {hasExistingLog ? "Tudo anotado por hoje" : "Como você está hoje?"}
      </h1>
      {hasExistingLog && (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground/75">
          Pode atualizar sempre que quiser.
        </p>
      )}
    </div>
  );
}
