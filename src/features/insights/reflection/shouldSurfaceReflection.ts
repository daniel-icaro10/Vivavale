export function shouldSurfaceReflection({
  totalLogs,
  daysThisWeek,
  longitudinalState,
  daysSinceLastLog,
}: {
  totalLogs: number;
  daysThisWeek: number;
  longitudinalState: string;
  daysSinceLastLog: number | null;
}): boolean {
  if (totalLogs < 5) return false;
  if (longitudinalState === "neutral") return false;

  const hasRecentActivity = daysThisWeek >= 2;
  const isReturningWithHistory =
    daysSinceLastLog !== null && daysSinceLastLog >= 4 && totalLogs >= 10;

  return hasRecentActivity || isReturningWithHistory;
}
