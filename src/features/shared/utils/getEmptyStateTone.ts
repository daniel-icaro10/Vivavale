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
      title: "Um lugar só seu",
      description: "Os primeiros registros ajudam a entender seus padrões.",
    };
  }

  if (daysSinceLastLog !== null && daysSinceLastLog >= 7) {
    return {
      title: "Bem-vindo de volta",
      description: "Tudo bem recomeçar no seu ritmo.",
    };
  }

  if (currentWeekCount > 0 && currentWeekCount < 3) {
    return {
      title: "Cada dia conta",
      description: "Mesmo poucos registros já começam a mostrar sinais.",
    };
  }

  return {
    title: "A história começa no primeiro passo",
    description: "Cada dia registrado vai aparecendo aqui, aos poucos formando o seu caminho.",
  };
}
