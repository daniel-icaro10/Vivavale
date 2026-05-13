"use server";

import { headers } from "next/headers";
import { refresh } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { z } from "zod";

type ErrorResult = { error: string };
type SuccessResult = { success: true };

// ============================================================
// Schema de validação da subscription
// ============================================================

const pushSubscriptionSchema = z.object({
  endpoint: z.string().url("Endpoint inválido"),
  keys: z.object({
    p256dh: z.string().min(10),
    auth: z.string().min(10),
  }),
});

// ============================================================
// savePushSubscriptionAction
// Registra ou atualiza a subscription do dispositivo atual.
// Usa upsert em (endpoint) — endpoint é único globalmente.
// ============================================================

export async function savePushSubscriptionAction(
  subJson: unknown,
): Promise<ErrorResult | SuccessResult> {
  const parsed = pushSubscriptionSchema.safeParse(subJson);
  if (!parsed.success) {
    return { error: "Dados de push inválidos." };
  }

  const supabase = await createServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  // User-Agent truncado em 200 chars para identificação de dispositivo na UI
  const reqHeaders = await headers();
  const userAgent = (reqHeaders.get("user-agent") ?? "").slice(0, 200) || null;

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: parsed.data.endpoint,
      p256dh_key: parsed.data.keys.p256dh,
      auth_key: parsed.data.keys.auth,
      user_agent: userAgent,
      active: true,
    },
    { onConflict: "endpoint" },
  );

  if (error) {
    logger.error("Falha ao salvar push_subscription", {
      userId: user.id,
      error: error.message,
    });
    return { error: "Não foi possível ativar as notificações." };
  }

  logger.info("Push subscription registrada", { userId: user.id });
  return { success: true };
}

// ============================================================
// removePushSubscriptionAction
// Remove a subscription pelo endpoint — chamado no unsubscribe.
// ============================================================

export async function removePushSubscriptionAction(
  endpoint: string,
): Promise<ErrorResult | SuccessResult> {
  if (!endpoint) return { error: "Endpoint inválido." };

  const supabase = await createServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint)
    .eq("user_id", user.id);

  if (error) {
    logger.error("Falha ao remover push_subscription", {
      userId: user.id,
      error: error.message,
    });
    return { error: "Não foi possível desativar as notificações." };
  }

  logger.info("Push subscription removida", { userId: user.id });
  return { success: true };
}

// ============================================================
// saveNotificationPreferencesAction
// Upsert nas notification_preferences do usuário.
// ============================================================

const notifPrefsSchema = z.object({
  reminders_enabled: z.boolean(),
  quiet_hours_start: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable()
    .optional(),
  quiet_hours_end: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable()
    .optional(),
});

export async function saveNotificationPreferencesAction(
  data: unknown,
): Promise<ErrorResult | SuccessResult> {
  const parsed = notifPrefsSchema.safeParse(data);
  if (!parsed.success) return { error: "Dados inválidos." };

  const supabase = await createServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  // Busca timezone atual do perfil para sincronizar em notification_preferences
  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .single();

  const { error } = await supabase.from("notification_preferences").upsert(
    {
      user_id: user.id,
      reminders_enabled: parsed.data.reminders_enabled,
      quiet_hours_start: parsed.data.quiet_hours_start ?? null,
      quiet_hours_end: parsed.data.quiet_hours_end ?? null,
      timezone: profile?.timezone ?? "America/Sao_Paulo",
    },
    { onConflict: "user_id" },
  );

  if (error) {
    logger.error("Falha ao salvar notification_preferences", {
      userId: user.id,
      error: error.message,
    });
    return { error: "Não foi possível salvar. Tente novamente." };
  }

  refresh();
  return { success: true };
}
