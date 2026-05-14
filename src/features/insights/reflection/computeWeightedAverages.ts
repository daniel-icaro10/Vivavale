export interface WeightedAverages {
  pain: number | null;
  fatigue: number | null;
  sleep: number | null;
  mood: number | null;
}

type LogEntry = {
  pain_level: number;
  fatigue_level: number;
  sleep_quality: number;
  mood_level: number;
  date: string;
};

export function computeWeightedAverages(logs: LogEntry[]): WeightedAverages {
  if (logs.length === 0) {
    return { pain: null, fatigue: null, sleep: null, mood: null };
  }

  const sorted = logs.slice().sort((a, b) => b.date.localeCompare(a.date));
  const DECAY = 0.82;

  let totalWeight = 0;
  const sums = { pain: 0, fatigue: 0, sleep: 0, mood: 0 };

  sorted.forEach((log, i) => {
    const w = Math.pow(DECAY, i);
    totalWeight   += w;
    sums.pain     += log.pain_level    * w;
    sums.fatigue  += log.fatigue_level * w;
    sums.sleep    += log.sleep_quality * w;
    sums.mood     += log.mood_level    * w;
  });

  return {
    pain:    sums.pain    / totalWeight,
    fatigue: sums.fatigue / totalWeight,
    sleep:   sums.sleep   / totalWeight,
    mood:    sums.mood    / totalWeight,
  };
}
