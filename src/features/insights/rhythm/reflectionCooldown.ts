// Cooldown de reflexões — evita que o app "fale demais" em curtos períodos.
// localStorage: persiste entre sessões, funciona client-only.

const KEY_LAST    = "vl-reflection-last-at";
const KEY_COUNT   = "vl-reflection-count-week";
const KEY_WEEK    = "vl-reflection-week";
const COOLDOWN_MS = 36 * 60 * 60 * 1000; // 36 horas entre reflexões
const MAX_PER_WEEK = 3;

function currentWeekKey(): string {
  const now  = new Date();
  const year = now.getFullYear();
  const week = Math.floor(
    (now.getTime() - new Date(year, 0, 1).getTime()) / (7 * 86_400_000),
  );
  return `${year}-${week}`;
}

function readCount(): number {
  if (typeof window === "undefined") return 0;
  const week = localStorage.getItem(KEY_WEEK);
  if (week !== currentWeekKey()) return 0; // nova semana
  return Number(localStorage.getItem(KEY_COUNT) ?? 0);
}

/** Verdadeiro se ainda está no período de cooldown ou atingiu o limite semanal. */
export function isInReflectionCooldown(): boolean {
  if (typeof window === "undefined") return false;

  const lastAt = Number(localStorage.getItem(KEY_LAST) ?? 0);
  if (lastAt && Date.now() - lastAt < COOLDOWN_MS) return true;

  return readCount() >= MAX_PER_WEEK;
}

/** Registra que uma reflexão foi exibida. Deve ser chamado após renderizar. */
export function markReflectionShown(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY_LAST, String(Date.now()));
  localStorage.setItem(KEY_WEEK, currentWeekKey());
  localStorage.setItem(KEY_COUNT, String(readCount() + 1));
}

/** Reseta o cooldown (útil para testes ou mudança de semana). */
export function resetReflectionCooldown(): void {
  if (typeof window === "undefined") return;
  [KEY_LAST, KEY_COUNT, KEY_WEEK].forEach((k) => localStorage.removeItem(k));
}
