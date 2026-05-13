"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rateLimit";
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

export async function deleteAccountAction(
  confirmation: string,
): Promise<{ error: string } | void> {
  if (confirmation !== "DELETAR") {
    return { error: "Confirmação inválida. Digite DELETAR para confirmar." };
  }

  const supabase = await createServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const allowed = await checkRateLimit("delete_account", user.id);
  if (!allowed) {
    return { error: "Muitas tentativas. Aguarde alguns minutos." };
  }

  try {
    const admin = createAdminClient();
    // deleteUser cascateia FK para profiles, daily_logs, medications, reminders, etc.
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) return { error: "Não foi possível excluir a conta. Tente novamente." };
  } catch {
    return { error: "Não foi possível excluir a conta. Tente novamente." };
  }

  redirect("/");
}
