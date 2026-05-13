/**
 * cleanup-subscriptions — Supabase Edge Function
 *
 * Remove push_subscriptions inativas (error_count >= MAX_ERRORS ou active = false).
 * Invocar periodicamente (ex.: diariamente via pg_cron).
 *
 * Segredos necessários:
 *   SUPABASE_URL              — URL do projeto
 *   SUPABASE_SERVICE_ROLE_KEY — chave service_role (ignora RLS)
 */

import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const MAX_ERRORS = 5;

Deno.serve(async () => {
  // Remove subscriptions marcadas como inativas por erro persistente
  const { data, error } = await supabase
    .from("push_subscriptions")
    .delete()
    .or(`active.eq.false,error_count.gte.${MAX_ERRORS}`)
    .select("id");

  if (error) {
    console.error("Falha ao limpar subscriptions", error.message);
    return new Response("error", { status: 500 });
  }

  const removed = data?.length ?? 0;
  console.log(`Cleanup: ${removed} subscriptions removidas`);

  return new Response(JSON.stringify({ removed }), {
    headers: { "Content-Type": "application/json" },
  });
});
