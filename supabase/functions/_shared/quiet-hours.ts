/**
 * Verifica se o momento atual está dentro do horário de silêncio do usuário.
 * Suporta intervalos que cruzam a meia-noite (ex.: 22:00 – 07:00).
 */
export function isQuietHours(
  quietStart: string | null,
  quietEnd: string | null,
  timezone: string,
  now: Date = new Date(),
): boolean {
  if (!quietStart || !quietEnd) return false;

  // Extrai HH:MM no timezone do usuário
  const fmt = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timezone,
  });

  const localTime = fmt.format(now); // "HH:MM"
  const [hh, mm] = localTime.split(":").map(Number);
  const current = hh * 60 + mm;

  const [sh, sm] = quietStart.slice(0, 5).split(":").map(Number);
  const [eh, em] = quietEnd.slice(0, 5).split(":").map(Number);
  const start = sh * 60 + sm;
  const end = eh * 60 + em;

  if (start <= end) {
    // Intervalo simples: 08:00 – 20:00
    return current >= start && current < end;
  } else {
    // Intervalo que cruza meia-noite: 22:00 – 07:00
    return current >= start || current < end;
  }
}
