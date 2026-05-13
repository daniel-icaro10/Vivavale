import type { DailyLog } from "@/types/app";
import type { DayGroup } from "@/features/insights/types/insights";

const WEEKDAYS = [
  "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira",
  "Quinta-feira", "Sexta-feira", "Sábado",
];
const MONTHS = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function formatDayLabel(dateStr: string, todayStr?: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const entryDate = new Date(year, month - 1, day);
  const weekday = WEEKDAYS[entryDate.getDay()];
  const monthName = MONTHS[month - 1];

  if (!todayStr) return `${weekday}, ${day} de ${monthName}`;

  if (dateStr === todayStr) return "Hoje";

  const [ty, tm, td] = todayStr.split("-").map(Number);
  const today = new Date(ty, tm - 1, td);
  const diffDays = Math.round((today.getTime() - entryDate.getTime()) / 86_400_000);

  if (diffDays === 1) return "Ontem";
  if (diffDays <= 6) return weekday;

  return `${weekday}, ${day} de ${monthName}`;
}

export function groupByDay(logs: DailyLog[], todayStr?: string): DayGroup[] {
  const map = new Map<string, DailyLog[]>();

  for (const log of logs) {
    const existing = map.get(log.date) ?? [];
    existing.push(log);
    map.set(log.date, existing);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, dayLogs]) => ({
      date,
      label: formatDayLabel(date, todayStr),
      logs: dayLogs,
    }));
}

/** Semana ISO: segunda a domingo. Retorna "YYYY-MM-DD" da segunda-feira da semana do date. */
export function getWeekStart(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  const dow = d.getDay();
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
