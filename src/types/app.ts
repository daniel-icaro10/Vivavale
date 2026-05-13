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

export type Reminder = Database["public"]["Tables"]["reminders"]["Row"];
export type ReminderInsert =
  Database["public"]["Tables"]["reminders"]["Insert"];
export type ReminderUpdate =
  Database["public"]["Tables"]["reminders"]["Update"];

export type NotificationPreferences =
  Database["public"]["Tables"]["notification_preferences"]["Row"];
export type NotificationPreferencesInsert =
  Database["public"]["Tables"]["notification_preferences"]["Insert"];
export type NotificationPreferencesUpdate =
  Database["public"]["Tables"]["notification_preferences"]["Update"];

export type PushSubscriptionRow =
  Database["public"]["Tables"]["push_subscriptions"]["Row"];
export type PushSubscriptionInsert =
  Database["public"]["Tables"]["push_subscriptions"]["Insert"];

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

/** Resumo semanal calculado na camada de aplicação */
export type WeeklySummary = {
  avg_pain: number | null;
  avg_fatigue: number | null;
  avg_sleep: number | null;
  avg_mood: number | null;
  avg_anxiety: number | null;
  days_logged: number;
};

/** Reminder com nome do medicamento — derivado por join em application code */
export type ReminderWithMedication = Reminder & {
  medicationName: string;
};
