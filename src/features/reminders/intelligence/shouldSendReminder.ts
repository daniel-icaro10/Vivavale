// Gate function: decide se um lembrete deve ser enviado agora.
// Resposta binária — sem "talvez" ou lógica parcial.

import type { ReminderBehavior } from "./detectReminderBehavior";
import type { ReminderCadence } from "./computeReminderCadence";

export interface ReminderGateInput {
  behavior:          ReminderBehavior;
  cadence:           ReminderCadence;
  /** Timestamp do último lembrete enviado (ms) ou null se nunca enviado. */
  lastSentAt:        number | null;
  /** Lembretes enviados nesta semana. */
  sentThisWeek:      number;
  /** Usuário já registrou hoje? */
  hasLoggedToday:    boolean;
  /** Hora atual (0–23). */
  currentHour:       number;
}

export function shouldSendReminder(input: ReminderGateInput): boolean {
  const {
    behavior,
    cadence,
    lastSentAt,
    sentThisWeek,
    hasLoggedToday,
    currentHour,
  } = input;

  // Se já registrou hoje, não precisa de lembrete
  if (hasLoggedToday) return false;

  // Respeitou o limite semanal
  if (sentThisWeek >= cadence.maxPerWeek) return false;

  // Respeitou o intervalo mínimo
  if (lastSentAt !== null) {
    const hoursSinceLast = (Date.now() - lastSentAt) / 3_600_000;
    if (hoursSinceLast < cadence.minIntervalHours) return false;
  }

  // Usuário "ignoring" → só um lembrete silencioso semanal, nunca agressivo
  if (behavior === "ignoring" && sentThisWeek >= 1) return false;

  // Preferência de horário (se definida, respeita janela de ±2h)
  if (cadence.preferMorning && (currentHour < 7 || currentHour > 11)) return false;
  if (cadence.preferEvening && (currentHour < 18 || currentHour > 22)) return false;

  return true;
}
