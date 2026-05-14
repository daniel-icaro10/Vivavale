// Seleciona o tom do lembrete conforme o comportamento do usuário.
// As frases são discretas, acolhedoras e nunca soam como pressão.

import type { ReminderBehavior } from "./detectReminderBehavior";

export type ReminderTone = "quiet" | "gentle" | "warm" | "welcoming";

interface ReminderMessage {
  tone: ReminderTone;
  body: string;
}

const MESSAGES: Record<ReminderBehavior, ReminderMessage[]> = {
  consistent: [
    { tone: "quiet",  body: "Um momento para registrar como você está." },
    { tone: "quiet",  body: "Seu registro de hoje ainda não foi feito." },
  ],
  morning: [
    { tone: "gentle", body: "Bom dia. Como você acordou hoje?" },
    { tone: "gentle", body: "Um momento tranquilo para anotar como está." },
  ],
  evening: [
    { tone: "gentle", body: "Como foi seu dia? Um registro rápido." },
    { tone: "gentle", body: "Antes de terminar o dia — como você está?" },
  ],
  returning: [
    { tone: "welcoming", body: "Bem-vindo de volta. Sem pressa, sem pressão." },
    { tone: "welcoming", body: "É bom ter você aqui de novo." },
  ],
  ignoring: [
    { tone: "quiet", body: "Quando sentir vontade, seus registros esperam." },
    { tone: "quiet", body: "Aqui quando você quiser." },
  ],
  irregular: [
    { tone: "warm", body: "Lembrete gentil: horário do registro." },
    { tone: "warm", body: "Um momento para anotar como você está." },
  ],
};

export function selectReminderTone(
  behavior: ReminderBehavior,
  seed: number = Date.now(),
): ReminderMessage {
  const pool = MESSAGES[behavior];
  return pool[seed % pool.length];
}
