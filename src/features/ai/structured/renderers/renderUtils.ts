/** Garante que o texto termina com pontuação (.  !  ?  …). */
export function ensureSentenceEnd(text: string): string {
  if (!text) return "";
  if (/[.!?…]$/.test(text)) return text;
  return text + ".";
}
