export const PROFILE_NAME_MAX = 100;

// Lista de timezones IANA suportados pelo VivaLeve.
// Os valores aqui são a fonte de verdade para validação e exibição.
// Atualizar os dois arrays juntos ao adicionar novos fusos.
export const TIMEZONE_VALUES = [
  // Brasil
  "America/Sao_Paulo",
  "America/Manaus",
  "America/Belem",
  "America/Fortaleza",
  "America/Recife",
  "America/Bahia",
  "America/Cuiaba",
  "America/Campo_Grande",
  "America/Porto_Velho",
  "America/Boa_Vista",
  "America/Noronha",
  // Internacional
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/Lisbon",
  "Europe/London",
  "America/Argentina/Buenos_Aires",
] as const;

export type TimezoneValue = (typeof TIMEZONE_VALUES)[number];

export const TIMEZONE_GROUPS = [
  {
    group: "Brasil",
    options: [
      { value: "America/Sao_Paulo", label: "Brasília / São Paulo (BRT −3)" },
      { value: "America/Manaus", label: "Manaus (AMT −4)" },
      { value: "America/Belem", label: "Belém (BRT −3)" },
      { value: "America/Fortaleza", label: "Fortaleza (BRT −3)" },
      { value: "America/Recife", label: "Recife (BRT −3)" },
      { value: "America/Bahia", label: "Salvador (BRT −3)" },
      { value: "America/Cuiaba", label: "Cuiabá (AMT −4)" },
      { value: "America/Campo_Grande", label: "Campo Grande (AMT −4)" },
      { value: "America/Porto_Velho", label: "Porto Velho (AMT −4)" },
      { value: "America/Boa_Vista", label: "Boa Vista (AMT −4)" },
      { value: "America/Noronha", label: "Fernando de Noronha (FNT −2)" },
    ],
  },
  {
    group: "Internacional",
    options: [
      { value: "UTC", label: "UTC ±0" },
      { value: "America/New_York", label: "Nova York (EST −5)" },
      { value: "America/Los_Angeles", label: "Los Angeles (PST −8)" },
      { value: "Europe/Lisbon", label: "Lisboa (WET ±0)" },
      { value: "Europe/London", label: "Londres (GMT ±0)" },
      {
        value: "America/Argentina/Buenos_Aires",
        label: "Buenos Aires (ART −3)",
      },
    ],
  },
] as const satisfies ReadonlyArray<{
  group: string;
  options: ReadonlyArray<{ value: TimezoneValue; label: string }>;
}>;
