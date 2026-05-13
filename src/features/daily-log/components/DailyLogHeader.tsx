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
    <div>
      <p className="mb-1 text-sm capitalize text-muted-foreground">
        {formatted}
      </p>
      <h1 className="text-2xl font-semibold tracking-tight">
        {hasExistingLog ? "Tudo anotado por hoje" : "Como você está hoje?"}
      </h1>
      {hasExistingLog && (
        <p className="mt-1.5 text-sm text-muted-foreground">
          Pode atualizar sempre que quiser.
        </p>
      )}
    </div>
  );
}
