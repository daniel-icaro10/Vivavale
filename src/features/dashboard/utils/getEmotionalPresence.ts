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
    return { phrase: "Este é o começo do seu acompanhamento." };
  }

  if (daysSinceLastLog !== null && daysSinceLastLog >= 14) {
    return { phrase: "Mesmo depois de uma pausa mais longa, seus padrões ainda estão aqui." };
  }

  if (daysSinceLastLog !== null && daysSinceLastLog >= 7) {
    return { phrase: "Você voltou a registrar. A continuidade se retoma aos poucos." };
  }

  if (daysSinceLastLog !== null && daysSinceLastLog >= 3) {
    return { phrase: "Alguns dias sem registrar. Bom ter você por aqui." };
  }

  if (daysThisWeek >= 6) {
    return totalLogs >= 10
      ? { phrase: "Sua presença aqui tem sido constante." }
      : { phrase: "Você esteve aqui todos os dias desta semana." };
  }

  if (daysThisWeek >= 4) {
    return { phrase: "Seu ritmo continua aparecendo, dia após dia." };
  }

  if (hasLoggedToday) {
    return daysThisWeek === 1
      ? { phrase: "Primeiro momento registrado desta semana." }
      : { phrase: "Bom saber como você está hoje." };
  }

  if (daysThisWeek === 3) {
    return { phrase: "Três momentos registrados esta semana." };
  }

  if (daysThisWeek === 2) {
    return { phrase: "A continuidade desta semana começa a tomar forma." };
  }

  if (daysThisWeek === 1) {
    return { phrase: "A semana começou com um registro." };
  }

  return { phrase: "Hoje pode ser um bom momento para observar como você está." };
}
