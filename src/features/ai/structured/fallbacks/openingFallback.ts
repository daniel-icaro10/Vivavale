import type { NarrativeContext, NarrativeType } from "../../types/narrative";

export function openingFallback(ctx: NarrativeContext, _type: NarrativeType): string {
  const { daysLogged } = ctx;

  if (daysLogged === 0) return "Nenhum registro encontrado neste período.";
  if (daysLogged === 1) return "Você fez um registro nesta semana.";

  return `Ao longo de ${daysLogged} dia${daysLogged > 1 ? "s" : ""} registrados nesta semana`;
}
