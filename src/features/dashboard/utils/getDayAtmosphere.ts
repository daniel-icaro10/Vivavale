export type DayAtmosphere = "morning" | "afternoon" | "evening" | "night";

export function getDayAtmosphere(hour: number): DayAtmosphere {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 22) return "evening";
  return "night";
}

// Retorna uma linha contextual baseada no período do dia.
// Silêncio à tarde e à noite — menos intrusão, mais presença.
export function getAtmosphereSupplement(
  atmosphere: DayAtmosphere,
  hasLoggedToday: boolean,
): string | null {
  if (atmosphere === "morning" && !hasLoggedToday) {
    return "Como seu corpo está começando o dia?";
  }
  if (atmosphere === "evening" && !hasLoggedToday) {
    return "Talvez valha registrar como o dia terminou.";
  }
  return null;
}
