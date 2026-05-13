import type { DailyLog } from "@/types/app";

export type MonthGroup = {
  key: string;   // "2026-05" — usado como chave única e para ordenação
  label: string; // "Maio 2026"
  logs: DailyLog[];
};
