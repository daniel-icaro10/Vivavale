"use server";

import { refresh } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { profileSchema, type ProfileFormData } from "./schemas";

type ErrorResult = { error: string };
type SuccessResult = { success: true };

export async function updateProfileAction(
  data: ProfileFormData,
): Promise<ErrorResult | SuccessResult> {
  const parsed = profileSchema.safeParse(data);
  if (!parsed.success) return { error: "Dados inválidos." };

  const supabase = await createServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  try {
    const { error } = await supabase
      .from("profiles")
      .update({
        name: parsed.data.name,
        timezone: parsed.data.timezone,
      })
      .eq("id", user.id);

    if (error) return { error: "Não foi possível salvar. Tente novamente." };
  } catch {
    return { error: "Não foi possível salvar. Tente novamente." };
  }

  refresh();
  return { success: true };
}
