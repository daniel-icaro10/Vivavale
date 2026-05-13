import type { DailyLog } from "@/types/app";
import type { DayGroup } from "@/features/insights/types/insights";

const WEEKDAYS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

function formatDayLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  const weekday = WEEKDAYS[d.getDay()];
  const monthName = MONTHS[month - 1];
  return `${weekday}, ${day} de ${monthName}`;
}

export function groupByDay(logs: DailyLog[]): DayGroup[] {
  const map = new Map<string, DailyLog[]>();

  for (const log of logs) {
    const existing = map.get(log.date) ?? [];
    existing.push(log);
    map.set(log.date, existing);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a)) // desc
    .map(([date, dayLogs]) => ({
      date,
      label: formatDayLabel(date),
      logs: dayLogs,
    }));
}

/** Semana ISO: segunda a domingo. Retorna "YYYY-MM-DD" da segunda-feira da semana do date. */
export function getWeekStart(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  const dow = d.getDay(); // 0=Dom, 1=Seg
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

/** Retorna "YYYY-MM-DD" do domingo da semana de weekStart. */
export function getWeekEnd(weekStart: string): string {
  const [year, month, day] = weekStart.split("-").map(Number);
  const d = new Date(year, month - 1, day + 6);
  return d.toISOString().slice(0, 10);
}
