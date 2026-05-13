"use server";

import { refresh } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { DEFAULT_TIMEZONE } from "./constants";
import { reminderSchema, reminderFormSchema, type ReminderFormData } from "./schemas";
import { computeNextTriggerAt, normalizeTimeLocal } from "./utils/scheduling";

type ErrorResult = { error: string };
type SuccessResult = { success: true };

// ============================================================
// Helpers internos
// ============================================================

/**
 * Busca o timezone do perfil do usuário autenticado.
 * Fallback para DEFAULT_TIMEZONE se o perfil não existir ou o campo estiver vazio.
 */
async function getUserTimezone(userId: string): Promise<string> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", userId)
    .single();
  return data?.timezone ?? DEFAULT_TIMEZONE;
}

/**
 * Verifica se medication_id pertence ao usuário autenticado.
 * Defesa em profundidade além do RLS — evita race condition ou falha de policy.
 */
async function assertMedicationOwnership(
  medicationId: string,
  userId: string,
): Promise<boolean> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("medications")
    .select("id")
    .eq("id", medicationId)
    .eq("user_id", userId)
    .single();
  return data !== null;
}

// ============================================================
// createReminderAction
// ============================================================

export async function createReminderAction(
  data: ReminderFormData,
): Promise<ErrorResult | SuccessResult> {
  const parsed = reminderFormSchema.safeParse(data);
  if (!parsed.success) return { error: "Dados inválidos." };

  const supabase = await createServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  // Verificar ownership do medicamento antes de inserir
  const owns = await assertMedicationOwnership(
    parsed.data.medication_id,
    user.id,
  );
  if (!owns) {
    return { error: "Medicamento não encontrado." };
  }

  // Buscar timezone do perfil — fonte de verdade do fuso do usuário
  const timezone = await getUserTimezone(user.id);

  // Normalizar time_local para "HH:MM" (caso venha com segundos do DB)
  const timeLocal = normalizeTimeLocal(parsed.data.time_local);

  // Montar payload completo com timezone
  const fullPayload = reminderSchema.safeParse({
    ...parsed.data,
    time_local: timeLocal,
    timezone,
  });
  if (!fullPayload.success) return { error: "Dados inválidos." };

  // Calcular next_trigger_at timezone-safe
  const nextTriggerAt = computeNextTriggerAt(timeLocal, timezone);

  try {
    const { error } = await supabase.from("reminders").insert({
      user_id: user.id,
      medication_id: fullPayload.data.medication_id,
      time_local: timeLocal,
      timezone,
      recurrence: fullPayload.data.recurrence,
      active: fullPayload.data.active,
      next_trigger_at: nextTriggerAt.toISOString(),
    });

    if (error) return { error: "Não foi possível criar o lembrete. Tente novamente." };
  } catch {
    return { error: "Não foi possível criar o lembrete. Tente novamente." };
  }

  refresh();
  return { success: true };
}

// ============================================================
// updateReminderAction
// ============================================================

export async function updateReminderAction(
  id: string,
  data: ReminderFormData,
): Promise<ErrorResult | SuccessResult> {
  const parsed = reminderFormSchema.safeParse(data);
  if (!parsed.success) return { error: "Dados inválidos." };

  const supabase = await createServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const owns = await assertMedicationOwnership(
    parsed.data.medication_id,
    user.id,
  );
  if (!owns) {
    return { error: "Medicamento não encontrado." };
  }

  // Ao editar, sincroniza timezone com o perfil atual.
  // Racional: se o usuário mudou de fuso (viagem ou mudança de cidade),
  // a edição explícita de um reminder atualiza seu snapshot de timezone.
  const timezone = await getUserTimezone(user.id);
  const timeLocal = normalizeTimeLocal(parsed.data.time_local);

  const fullPayload = reminderSchema.safeParse({
    ...parsed.data,
    time_local: timeLocal,
    timezone,
  });
  if (!fullPayload.success) return { error: "Dados inválidos." };

  const nextTriggerAt = computeNextTriggerAt(timeLocal, timezone);

  try {
    const { error } = await supabase
      .from("reminders")
      .update({
        medication_id: fullPayload.data.medication_id,
        time_local: timeLocal,
        timezone,
        recurrence: fullPayload.data.recurrence,
        active: fullPayload.data.active,
        next_trigger_at: nextTriggerAt.toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id); // defesa em profundidade além do RLS

    if (error) return { error: "Não foi possível atualizar. Tente novamente." };
  } catch {
    return { error: "Não foi possível atualizar. Tente novamente." };
  }

  refresh();
  return { success: true };
}

// ============================================================
// deleteReminderAction
// ============================================================

export async function deleteReminderAction(
  id: string,
): Promise<ErrorResult | SuccessResult> {
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
      .from("reminders")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return { error: "Não foi possível remover. Tente novamente." };
  } catch {
    return { error: "Não foi possível remover. Tente novamente." };
  }

  refresh();
  return { success: true };
}

// ============================================================
// toggleReminderAction
// ============================================================

export async function toggleReminderAction(
  id: string,
  active: boolean,
): Promise<ErrorResult | SuccessResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  try {
    // Ao reativar, recalcula next_trigger_at com o timezone atual do perfil.
    // Ao pausar, mantém next_trigger_at como está (o índice parcial ignora inativos).
    let updatePayload: { active: boolean; next_trigger_at?: string } = { active };

    if (active) {
      const timezone = await getUserTimezone(user.id);

      // Busca time_local do reminder existente para recalcular
      const { data: existing } = await supabase
        .from("reminders")
        .select("time_local, timezone")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (existing) {
        const timeLocal = normalizeTimeLocal(existing.time_local);
        const tz = timezone || existing.timezone;
        updatePayload = {
          active: true,
          next_trigger_at: computeNextTriggerAt(timeLocal, tz).toISOString(),
        };
      }
    }

    const { error } = await supabase
      .from("reminders")
      .update(updatePayload)
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return { error: "Não foi possível atualizar. Tente novamente." };
  } catch {
    return { error: "Não foi possível atualizar. Tente novamente." };
  }

  refresh();
  return { success: true };
}
