"use server";

import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { computeInsights } from "@/features/insights/engine/compute";
import type { SymptomAnswers } from "@/features/insights/types";

type ErrorResult = { error: string };
type SuccessResult = { sessionToken: string };

const symptomAnswersSchema = z.object({
  main_symptoms: z
    .array(z.enum(["pain", "fatigue", "anxiety", "sleep", "mood", "other"]))
    .min(1, "Selecione ao menos um sintoma."),
  intensity: z.number().int().min(1).max(10),
  frequency: z.enum(["daily", "few_times_week", "weekly", "rarely"]),
  sleep_quality: z.number().int().min(1).max(10),
  energy_level: z.number().int().min(1).max(10),
  mood_level: z.number().int().min(1).max(10),
  symptom_duration: z.enum(["less_week", "weeks", "months", "over_year"]),
  daily_impact: z.number().int().min(1).max(5),
  has_medications: z.boolean(),
  medications_text: z.string().max(500).optional(),
});

export async function createPublicSessionAction(
  raw: unknown,
): Promise<ErrorResult | SuccessResult> {
  const parsed = symptomAnswersSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Dados inválidos. Verifique as respostas e tente novamente." };
  }

  const answers = parsed.data as SymptomAnswers;
  const { scores, insights } = computeInsights(answers);

  const sessionToken = crypto.randomUUID();

  const supabase = await createServerClient();
  const { error } = await supabase.from("public_symptom_sessions").insert({
    session_token: sessionToken,
    answers: answers as unknown as Record<string, unknown>,
    computed_scores: scores as unknown as Record<string, unknown>,
    computed_insights: insights as unknown as Record<string, unknown>,
  });

  if (error) {
    return { error: "Não foi possível salvar a análise. Tente novamente." };
  }

  return { sessionToken };
}
