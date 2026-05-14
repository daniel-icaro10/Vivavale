export interface EmptyStateTone {
  title: string;
  description: string;
}

export function getEmptyStateTone({
  daysSinceLastLog = null,
  totalLogs = 0,
  currentWeekCount = 0,
}: {
  daysSinceLastLog?: number | null;
  totalLogs?: number;
  currentWeekCount?: number;
} = {}): EmptyStateTone {
  if (totalLogs === 0) {
    return {
      title: "Um espaço esperando continuidade",
      description: "Os registros começam a formar contexto com o tempo.",
    };
  }

  if (daysSinceLastLog !== null && daysSinceLastLog >= 7) {
    return {
      title: "O ritmo tem o seu próprio tempo",
      description: "Mesmo entradas espaçadas ajudam a perceber padrões.",
    };
  }

  if (currentWeekCount > 0 && currentWeekCount < 3) {
    return {
      title: "Os primeiros passos",
      description: "Esse espaço guarda os momentos que você decide registrar.",
    };
  }

  return {
    title: "A continuidade tem forma própria",
    description: "Mesmo registros espaçados continuam fazendo parte do percurso.",
  };
}
