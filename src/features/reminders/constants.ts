export const RECURRENCE_OPTIONS = [
  { value: "daily", label: "Todos os dias" },
  { value: "weekdays", label: "Dias úteis (seg–sex)" },
] as const;

export type RecurrenceValue = (typeof RECURRENCE_OPTIONS)[number]["value"];

export const RECURRENCE_LABELS: Record<string, string> = {
  daily: "Todos os dias",
  weekdays: "Dias úteis",
  custom_future: "Personalizado",
};

// Timezone padrão do Brasil — usado como fallback quando profiles.timezone não está disponível.
export const DEFAULT_TIMEZONE = "America/Sao_Paulo";

// Fuso horário mínimo/máximo aceitável para validação de nomes IANA.
// A validação real é feita via Intl.DateTimeFormat.
export const IANA_TIMEZONE_MIN_LEN = 3;
