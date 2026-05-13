"use server";

import { refresh } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { dailyLogSchema, type DailyLogFormData } from "./schemas";

type ErrorResult = { error: string };
type SuccessResult = { success: true };

export async function saveDailyLogAction(
  data: DailyLogFormData,
): Promise<ErrorResult | SuccessResult> {
  const parsed = dailyLogSchema.safeParse(data);
  if (!parsed.success) return { error: "Dados inválidos." };

  const supabase = await createServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const allowed = await checkRateLimit("save_daily_log", user.id);
  if (!allowed) return { error: "Muitas solicitações. Aguarde alguns segundos." };

  const { error } = await supabase.from("daily_logs").upsert(
    {
      user_id: user.id,
      date: parsed.data.date,
      pain_level: parsed.data.pain_level,
      fatigue_level: parsed.data.fatigue_level,
      sleep_quality: parsed.data.sleep_quality,
      mood_level: parsed.data.mood_level,
      anxiety_level: parsed.data.anxiety_level,
      notes: parsed.data.notes ?? null,
    },
    { onConflict: "user_id,date" },
  );

  if (error) return { error: "Não foi possível salvar. Tente novamente." };

  refresh();
  return { success: true };
}
