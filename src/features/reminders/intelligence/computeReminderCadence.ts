// Computa a cadência ideal de lembretes com base no comportamento detectado.
// Output: intervalo em horas entre lembretes (menor = mais frequente).

import type { ReminderBehavior } from "./detectReminderBehavior";

export interface ReminderCadence {
  /** Intervalo mínimo entre envios (horas). */
  minIntervalHours: number;
  /** Quantidade máxima de lembretes por semana. */
  maxPerWeek: number;
  /** Se verdadeiro, prefere horários noturnos (19–22h). */
  preferEvening: boolean;
  /** Se verdadeiro, prefere horários matutinos (7–10h). */
  preferMorning: boolean;
}

export function computeReminderCadence(
  behavior: ReminderBehavior,
): ReminderCadence {
  switch (behavior) {
    case "consistent":
      // Usuário consistente: lembretes pouco frequentes, quase decorativos
      return { minIntervalHours: 72, maxPerWeek: 1, preferEvening: false, preferMorning: false };

    case "morning":
      return { minIntervalHours: 24, maxPerWeek: 3, preferEvening: false, preferMorning: true };

    case "evening":
      return { minIntervalHours: 24, maxPerWeek: 3, preferEvening: true, preferMorning: false };

    case "returning":
      // Retorno após pausa: um lembrete acolhedor, sem pressão
      return { minIntervalHours: 48, maxPerWeek: 2, preferEvening: false, preferMorning: false };

    case "ignoring":
      // Reduz frequência — mais lembretes não ajudam
      return { minIntervalHours: 96, maxPerWeek: 1, preferEvening: false, preferMorning: false };

    case "irregular":
    default:
      return { minIntervalHours: 36, maxPerWeek: 2, preferEvening: false, preferMorning: false };
  }
}
