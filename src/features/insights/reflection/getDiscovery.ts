import { DISCOVERY_POOL } from "./discoveryPool";

export function shouldSurfaceDiscovery({
  totalLogs,
  daysThisWeek,
  longitudinalState,
}: {
  totalLogs: number;
  daysThisWeek: number;
  longitudinalState: string;
}): boolean {
  return totalLogs >= 15 && daysThisWeek >= 4 && longitudinalState === "consistent";
}

export function getDiscovery(totalLogs: number): string {
  return DISCOVERY_POOL[totalLogs % DISCOVERY_POOL.length];
}
