/**
 * send-reminders — Supabase Edge Function
 *
 * Invocada a cada minuto via pg_cron (ou webhook).
 * Busca reminders com next_trigger_at <= now() e envia push notifications.
 *
 * Segredos necessários (configurar em Supabase > Edge Functions > Secrets):
 *   SUPABASE_URL              — URL do projeto
 *   SUPABASE_SERVICE_ROLE_KEY — chave service_role (ignora RLS)
 *   VAPID_PUBLIC_KEY          — chave pública VAPID (base64url)
 *   VAPID_PRIVATE_KEY         — chave privada VAPID (base64url)
 *   VAPID_SUBJECT             — mailto: ou URL do app
 */

import webpush from "npm:web-push@3";
import { createClient } from "npm:@supabase/supabase-js@2";
import { isQuietHours } from "../_shared/quiet-hours.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

webpush.setVapidDetails(
  Deno.env.get("VAPID_SUBJECT")!,
  Deno.env.get("VAPID_PUBLIC_KEY")!,
  Deno.env.get("VAPID_PRIVATE_KEY")!,
);

const BATCH_SIZE = 50;
const MAX_ERRORS = 5;

Deno.serve(async () => {
  const now = new Date();

  const { data: reminders, error: fetchError } = await supabase
    .from("reminders")
    .select(`
      id,
      user_id,
      time_local,
      timezone,
      recurrence,
      medications ( name ),
      notification_preferences (
        reminders_enabled,
        quiet_hours_start,
        quiet_hours_end,
        timezone
      ),
      push_subscriptions (
        id,
        endpoint,
        p256dh_key,
        auth_key,
        error_count
      )
    `)
    .eq("active", true)
    .lte("next_trigger_at", now.toISOString())
    .limit(BATCH_SIZE);

  if (fetchError) {
    console.error("Falha ao buscar reminders", fetchError.message);
    return new Response("error", { status: 500 });
  }

  const results = await Promise.allSettled(
    (reminders ?? []).map((r) => processReminder(r, now)),
  );

  const sent = results.filter((r) => r.status === "fulfilled" && r.value).length;
  const failed = results.filter((r) => r.status === "rejected").length;
  console.log(`Processados: ${sent} enviados, ${failed} falhas`);

  return new Response(JSON.stringify({ sent, failed }), {
    headers: { "Content-Type": "application/json" },
  });
});

// deno-lint-ignore no-explicit-any
async function processReminder(reminder: any, now: Date): Promise<boolean> {
  const prefs = Array.isArray(reminder.notification_preferences)
    ? reminder.notification_preferences[0]
    : reminder.notification_preferences;

  const userTz = prefs?.timezone ?? reminder.timezone ?? "America/Sao_Paulo";

  const shouldSkip =
    prefs?.reminders_enabled === false ||
    isQuietHours(prefs?.quiet_hours_start, prefs?.quiet_hours_end, userTz, now);

  if (shouldSkip) {
    await advanceNextTrigger(reminder, now);
    return false;
  }

  const subscriptions = Array.isArray(reminder.push_subscriptions)
    ? reminder.push_subscriptions
    : [];

  if (subscriptions.length === 0) {
    await advanceNextTrigger(reminder, now);
    return false;
  }

  const medicationName = reminder.medications?.name ?? null;
  const payload = JSON.stringify({
    title: "VivaLeve",
    body: medicationName
      ? `Hora de tomar: ${medicationName}`
      : "Lembrete gentil: horário do seu remédio.",
    reminderId: reminder.id,
    medicationName,
  });

  let anySent = false;

  for (const sub of subscriptions) {
    if ((sub.error_count ?? 0) >= MAX_ERRORS) continue;

    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh_key, auth: sub.auth_key } },
        payload,
      );

      if (sub.error_count > 0) {
        await supabase
          .from("push_subscriptions")
          .update({ error_count: 0, last_error: null })
          .eq("id", sub.id);
      }

      anySent = true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const newCount = (sub.error_count ?? 0) + 1;

      await supabase
        .from("push_subscriptions")
        .update({
          error_count: newCount,
          last_error: msg.slice(0, 500),
          active: newCount < MAX_ERRORS,
        })
        .eq("id", sub.id);

      console.warn(`Push falhou sub=${sub.id}: ${msg}`);
    }
  }

  await supabase
    .from("reminders")
    .update({ last_attempt_at: now.toISOString() })
    .eq("id", reminder.id);

  await advanceNextTrigger(reminder, now);
  return anySent;
}

// deno-lint-ignore no-explicit-any
async function advanceNextTrigger(reminder: any, from: Date): Promise<void> {
  const tz = reminder.timezone ?? "America/Sao_Paulo";
  const rec: "daily" | "weekdays" =
    reminder.recurrence === "weekdays" ? "weekdays" : "daily";
  const next = computeNextTriggerAt(reminder.time_local, tz, rec, from);

  await supabase
    .from("reminders")
    .update({ next_trigger_at: next.toISOString() })
    .eq("id", reminder.id);
}

/**
 * Calcula o próximo instante UTC para um horário local.
 * Espelha a lógica de src/features/reminders/utils/scheduling.ts.
 */
function computeNextTriggerAt(
  timeLocal: string,
  timezone: string,
  recurrence: "daily" | "weekdays",
  from: Date,
): Date {
  const [hh, mm] = timeLocal.slice(0, 5).split(":").map(Number);

  for (let i = 1; i <= 8; i++) {
    const seed = new Date(from.getTime() + i * 86400_000);

    // Data local no timezone do usuário
    const dateFmt = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: timezone,
    });
    const [y, mo, d] = dateFmt.format(seed).split("-").map(Number);

    // Dia da semana no timezone do usuário
    const dowFmt = new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      timeZone: timezone,
    });
    const dow = dowFmt.format(seed);
    if (recurrence === "weekdays" && (dow === "Sat" || dow === "Sun")) continue;

    // Converte "YYYY-MM-DD HH:MM" local → UTC usando Intl
    const localIso = `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}T${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00`;
    const utcMs = localDateToUtcMs(localIso, timezone);
    return new Date(utcMs);
  }

  return new Date(from.getTime() + 86400_000);
}

/**
 * Converte uma string de data/hora local ("YYYY-MM-DDTHH:MM:SS") no timezone dado para ms UTC.
 * Usa bisseção para lidar corretamente com DST.
 */
function localDateToUtcMs(localIso: string, timezone: string): number {
  const naive = new Date(localIso + "Z"); // trata como UTC para obter valor numérico aproximado
  const formatter = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: timezone,
  });

  // Offset aproximado: diferença entre o que o Intl reporta e o que queríamos
  const asLocal = formatter.format(naive).replace(", ", "T");
  const diff = naive.getTime() - new Date(asLocal + "Z").getTime();
  return naive.getTime() + diff;
}
