import { DISCOVERY_POOL, SLOW_DISCOVERY_POOL } from "./discoveryPool";

export function shouldSurfaceSlowDiscovery({
  totalLogs,
  daysThisWeek,
  longitudinalState,
}: {
  totalLogs: number;
  daysThisWeek: number;
  longitudinalState: string;
}): boolean {
  return totalLogs >= 10 && daysThisWeek >= 4 && longitudinalState === "consistent";
}

export function getSlowDiscovery(totalLogs: number): string {
  return SLOW_DISCOVERY_POOL[totalLogs % SLOW_DISCOVERY_POOL.length];
}

export function shouldSurfaceDiscovery({
  totalLogs,
  daysThisWeek,
  longitudinalState,
}: {
  totalLogs: number;
  daysThisWeek: number;
  longitudinalState: string;
}): boolean {
  return totalLogs >= 8 && daysThisWeek >= 4 && longitudinalState === "consistent";
}

export function getDiscovery(totalLogs: number): string {
  return DISCOVERY_POOL[totalLogs % DISCOVERY_POOL.length];
}
