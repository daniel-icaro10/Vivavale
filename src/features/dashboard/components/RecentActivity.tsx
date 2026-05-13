interface RecentActivityProps {
  lastLogDate: string | null;
  todayStr: string;
}

function relativeDatePt(dateStr: string, todayStr: string): string {
  const today = new Date(todayStr + "T00:00:00Z");
  const date = new Date(dateStr + "T00:00:00Z");
  const diffDays = Math.round(
    (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return "hoje";
  if (diffDays === 1) return "ontem";
  if (diffDays < 7) return `há ${diffDays} dias`;
  if (diffDays < 14) return "há uma semana";
  if (diffDays < 30) return `há ${Math.round(diffDays / 7)} semanas`;
  return "há mais de um mês";
}

export function RecentActivity({ lastLogDate, todayStr }: RecentActivityProps) {
  if (!lastLogDate || lastLogDate === todayStr) return null;

  const relative = relativeDatePt(lastLogDate, todayStr);

  return (
    <p className="px-1 text-xs text-muted-foreground">
      Último registro:{" "}
      <span className="text-foreground">{relative}</span>
    </p>
  );
}
