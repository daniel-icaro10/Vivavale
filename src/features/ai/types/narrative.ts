/** Payload enviado à API de IA — apenas dados agregados, sem PII. */
export interface NarrativeContext {
  daysLogged: number;
  avgPain: number | null;
  avgFatigue: number | null;
  avgSleep: number | null;
  avgMood: number | null;
  trends: Array<{
    dimension: string;
    trend: "improving" | "worsening" | "stable" | "insufficient_data";
  }>;
  correlations: Array<{
    label: string;
    strength: "strong" | "moderate";
  }>;
}

export interface NarrativeResult {
  text: string;
  /** true = gerada por IA; false = fallback determinístico */
  isAI: boolean;
  /** Tempo de geração em ms (apenas para observabilidade) */
  latencyMs?: number;
}

export type NarrativeType = "weekly_summary" | "timeline_reflection";
