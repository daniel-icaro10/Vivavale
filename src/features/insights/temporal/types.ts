export interface TemporalContext {
  totalLogs: number;
  daysThisWeek: number;
  daysSinceLastLog: number | null;
  longitudinalState: string;
}

export interface TemporalPattern {
  thread: string | null;
}
