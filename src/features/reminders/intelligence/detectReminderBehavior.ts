// Detecta padrões comportamentais de registro para adaptar lembretes.
// Trabalha exclusivamente com dados já disponíveis (datas de log + horários do lembrete).

export type ReminderBehavior =
  | "consistent"   // registra regularmente, lembretes pouco necessários
  | "morning"      // tende a registrar de manhã
  | "evening"      // tende a registrar à noite
  | "irregular"    // sem padrão claro
  | "ignoring"     // recebeu lembretes mas não registrou
  | "returning";   // pausa longa, voltando agora

export interface ReminderBehaviorInput {
  /** Últimas datas de log (ISO YYYY-MM-DD), ordem decrescente, máx 14. */
  recentLogDates: string[];
  /** Dias desde o último log. */
  daysSinceLastLog: number | null;
  /** Total de logs históricos (proxy 0-10). */
  totalLogs: number;
}

export function detectReminderBehavior(
  input: ReminderBehaviorInput,
): ReminderBehavior {
  const { recentLogDates, daysSinceLastLog, totalLogs } = input;

  // Retorno após pausa longa
  if (daysSinceLastLog !== null && daysSinceLastLog >= 7) return "returning";

  // Sem histórico suficiente
  if (totalLogs < 3) return "irregular";

  // Verifica frequência na última semana
  const recent7 = recentLogDates.filter((d) => {
    const daysAgo = Math.floor(
      (Date.now() - new Date(d).getTime()) / 86_400_000,
    );
    return daysAgo <= 6;
  });

  if (recent7.length === 0 && totalLogs >= 5) return "ignoring";
  if (recent7.length >= 5) return "consistent";

  return "irregular";
}
