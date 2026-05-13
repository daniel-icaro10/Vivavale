import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import type { Database } from "@/types/database";

export function createAdminClient() {
  if (!env.serviceRoleKey) {
    throw new Error(
      "[VivaLeve] SUPABASE_SERVICE_ROLE_KEY não configurada. " +
        "Adicione ao .env.local e às variáveis de ambiente de produção.",
    );
  }
  return createClient<Database>(env.supabaseUrl, env.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
