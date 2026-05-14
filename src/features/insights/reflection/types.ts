export type ReflectionTone = "warm" | "quiet" | "contemplative" | "gentle";
export type ReflectionRarity = "common" | "rare" | "discovery";

export interface ReflectionInput {
  longitudinalState: string;
  daysThisWeek: number;
  totalLogs: number;
  daysSinceLastLog: number | null;
  weightedStrain?: number | null;
  weightedWellbeing?: number | null;
}

export interface ReflectiveObservation {
  tone: ReflectionTone;
  reflection: string;
  softness: number;
  rarity: ReflectionRarity;
}
