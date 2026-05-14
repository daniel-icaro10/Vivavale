export interface EmotionalPresence {
  phrase: string;
}

export function getEmotionalPresence({
  daysSinceLastLog,
  totalLogs,
  daysThisWeek,
  hasLoggedToday = false,
}: {
  daysSinceLastLog: number | null;
  totalLogs: number;
  daysThisWeek: number;
  hasLoggedToday?: boolean;
}): EmotionalPresence {
  if (totalLogs === 0) {
    return { phrase: "Pronto para começar o seu acompanhamento." };
  }
  if (daysSinceLastLog !== null && daysSinceLastLog >= 14) {
    return { phrase: "Mesmo uma pausa longa não apaga seus padrões." };
  }
  if (daysSinceLastLog !== null && daysSinceLastLog >= 7) {
    return { phrase: "É bom ver você por aqui de novo." };
  }
  if (daysThisWeek >= 6) {
    return { phrase: "Você esteve aqui todos os dias. Isso conta." };
  }
  if (daysThisWeek >= 4) {
    return { phrase: "Seu ritmo continua aparecendo, dia após dia." };
  }
  if (hasLoggedToday) {
    return { phrase: "Bom saber como você está hoje." };
  }
  if (daysThisWeek >= 2) {
    return { phrase: `${daysThisWeek} dias esta semana — os padrões ficam mais claros.` };
  }
  if (daysThisWeek === 1) {
    return { phrase: "Cada registro é um gesto de cuidado consigo." };
  }
  return { phrase: "Hoje pode ser um bom dia para observar como você está." };
}
