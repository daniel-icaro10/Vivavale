import { z } from "zod";
import { isValidIANATimezone } from "./utils/scheduling";

// Horário local no formato "HH:MM" (output de <input type="time">).
// O banco armazena como PostgreSQL time ("HH:MM:SS") mas o formulário usa "HH:MM".
const timeLocalSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "Horário inválido — use o formato HH:MM");

// IANA timezone validado via Intl — sem lista estática.
const timezoneSchema = z
  .string()
  .min(3, "Fuso horário inválido")
  .refine(isValidIANATimezone, { message: "Fuso horário não reconhecido" });

export const reminderSchema = z.object({
  medication_id: z
    .string()
    .uuid("Selecione um medicamento válido"),

  time_local: timeLocalSchema,

  // timezone NÃO vem do formulário — é injetada pela Server Action a partir de
  // profiles.timezone. O schema valida-a internamente nas actions.
  timezone: timezoneSchema,

  recurrence: z.enum(["daily", "weekdays"] as const, {
    message: "Frequência inválida",
  }),

  active: z.boolean().default(true),
});

// Schema para o formulário — sem timezone (vem do servidor)
export const reminderFormSchema = reminderSchema.omit({ timezone: true });

export type ReminderFormInput = z.input<typeof reminderFormSchema>;
export type ReminderFormData = z.infer<typeof reminderFormSchema>;

// Schema completo — inclui timezone (usado internamente pelas actions)
export type ReminderPayload = z.infer<typeof reminderSchema>;

// Schema para notification_preferences
export const notificationPreferencesSchema = z.object({
  reminders_enabled: z.boolean(),
  quiet_hours_start: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Horário inválido")
    .nullable()
    .optional(),
  quiet_hours_end: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Horário inválido")
    .nullable()
    .optional(),
  timezone: timezoneSchema,
});

export type NotificationPreferencesData = z.infer<
  typeof notificationPreferencesSchema
>;
