"use server";

import { refresh } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { medicationSchema, type MedicationFormData } from "./schemas";

type ErrorResult = { error: string };
type SuccessResult = { success: true };

export async function createMedicationAction(
  data: MedicationFormData,
): Promise<ErrorResult | SuccessResult> {
  const parsed = medicationSchema.safeParse(data);
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
    const { error } = await supabase.from("medications").insert({
      user_id: user.id,
      name: parsed.data.name,
      dosage: parsed.data.dosage ?? null,
      frequency: parsed.data.frequency ?? null,
      start_date: parsed.data.start_date ?? null,
      active: parsed.data.active,
      notes: parsed.data.notes ?? null,
    });

    if (error) return { error: "Não foi possível salvar. Tente novamente." };
  } catch {
    return { error: "Não foi possível salvar. Tente novamente." };
  }

  refresh();
  return { success: true };
}

export async function updateMedicationAction(
  id: string,
  data: MedicationFormData,
): Promise<ErrorResult | SuccessResult> {
  const parsed = medicationSchema.safeParse(data);
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
      .from("medications")
      .update({
        name: parsed.data.name,
        dosage: parsed.data.dosage ?? null,
        frequency: parsed.data.frequency ?? null,
        start_date: parsed.data.start_date ?? null,
        active: parsed.data.active,
        notes: parsed.data.notes ?? null,
      })
      .eq("id", id)
      .eq("user_id", user.id); // dupla verificação além da RLS

    if (error) return { error: "Não foi possível atualizar. Tente novamente." };
  } catch {
    return { error: "Não foi possível atualizar. Tente novamente." };
  }

  refresh();
  return { success: true };
}

export async function deleteMedicationAction(
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
      .from("medications")
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
