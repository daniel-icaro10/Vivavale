import type { DailyLog } from "@/types/app";
import type { MonthGroup } from "../types";

function formatMonthLabel(year: number, month: number): string {
  // month é 1-indexed vindo do YYYY-MM-DD
  const monthName = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(
    new Date(year, month - 1, 1),
  );
  const capitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  return `${capitalized} ${year}`;
}

/**
 * Agrupa logs por mês/ano mantendo a ordem descendente da query.
 * Função pura — sem efeitos colaterais, roda no servidor.
 */
export function groupLogsByMonth(logs: DailyLog[]): MonthGroup[] {
  const map = new Map<string, MonthGroup>();

  for (const log of logs) {
    const [yearStr, monthStr] = log.date.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);
    const key = `${yearStr}-${monthStr}`;

    if (!map.has(key)) {
      map.set(key, {
        key,
        label: formatMonthLabel(year, month),
        logs: [],
      });
    }

    map.get(key)!.logs.push(log);
  }

  return Array.from(map.values());
}
