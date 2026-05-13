import { z } from "zod";

const symptomLevel = z.number().int().min(0).max(10);

export const dailyLogSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  pain_level: symptomLevel,
  fatigue_level: symptomLevel,
  sleep_quality: symptomLevel,
  mood_level: symptomLevel,
  anxiety_level: symptomLevel,
  notes: z.string().max(1000).optional(),
});

export type DailyLogFormData = z.infer<typeof dailyLogSchema>;
