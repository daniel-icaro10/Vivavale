/**
 * Calcula percentis sobre um array numérico.
 * Ordena uma cópia — o array original não é modificado.
 * Retorna 0 se o array estiver vazio.
 */
export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  if (p <= 0) return values[0] ?? 0;
  if (p >= 100) return values[values.length - 1] ?? 0;

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((sorted.length * p) / 100) - 1;
  return sorted[Math.max(0, index)] ?? 0;
}

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}
