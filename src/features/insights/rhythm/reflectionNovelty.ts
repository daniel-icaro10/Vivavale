// Novelty tracker — garante diversidade de ton em reflexões.
// Evita que o mesmo tipo de mensagem apareça repetidamente.

import type { ReflectionTone } from "@/features/insights/reflection/types";

const KEY = "vl-reflection-tone-history";
const MAX_HISTORY = 6;
const MIN_DISTANCE = 2; // quantidade mínima de reflexões diferentes antes de repetir um tom

function readHistory(): ReflectionTone[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as ReflectionTone[];
  } catch {
    return [];
  }
}

function writeHistory(history: ReflectionTone[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(history.slice(-MAX_HISTORY)));
}

/** Verdadeiro se este tom foi mostrado muito recentemente (dentro de MIN_DISTANCE posições). */
export function isToneRecentlyShown(tone: ReflectionTone): boolean {
  const history = readHistory();
  const recentSlice = history.slice(-MIN_DISTANCE);
  return recentSlice.includes(tone);
}

/** Filtra uma lista de tons para remover os mostrados recentemente. */
export function filterNovelTones(tones: ReflectionTone[]): ReflectionTone[] {
  const history = readHistory();
  const recentSlice = history.slice(-MIN_DISTANCE);
  const novel = tones.filter((t) => !recentSlice.includes(t));
  return novel.length > 0 ? novel : tones; // se todos são recentes, permite repetição
}

/** Registra o tom exibido. */
export function recordToneShown(tone: ReflectionTone): void {
  const history = readHistory();
  writeHistory([...history, tone]);
}
