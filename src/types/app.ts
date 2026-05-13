import type { Database } from "./database";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type DailyLog = Database["public"]["Tables"]["daily_logs"]["Row"];
export type DailyLogInsert =
  Database["public"]["Tables"]["daily_logs"]["Insert"];
export type DailyLogUpdate =
  Database["public"]["Tables"]["daily_logs"]["Update"];

export type Medication = Database["public"]["Tables"]["medications"]["Row"];
export type MedicationInsert =
  Database["public"]["Tables"]["medications"]["Insert"];
export type MedicationUpdate =
  Database["public"]["Tables"]["medications"]["Update"];

/** Nível de 0–10 usado em escalas de sintoma */
export type SymptomLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/** Dados do formulário de registro diário */
export type DailyLogFormData = {
  pain_level: SymptomLevel;
  fatigue_level: SymptomLevel;
  sleep_quality: SymptomLevel;
  mood_level: SymptomLevel;
  anxiety_level: SymptomLevel;
  notes: string;
};

/** Resumo semanal calculado para o dashboard */
export type WeeklySummary = {
  avg_pain: number | null;
  avg_fatigue: number | null;
  avg_sleep: number | null;
  avg_mood: number | null;
  avg_anxiety: number | null;
  days_logged: number;
};
