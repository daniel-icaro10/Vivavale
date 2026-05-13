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
      <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground/70 capitalize" suppressHydrationWarning>
        {formatted}
      </p>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        {hasExistingLog ? "Tudo anotado por hoje" : "Como você está hoje?"}
      </h1>
      {hasExistingLog && (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Pode atualizar sempre que quiser.
        </p>
      )}
    </div>
  );
}
