import { createServerClient } from "@/lib/supabase/server";

interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
}

const LIMITS: Record<string, RateLimitConfig> = {
  login:           { maxRequests: 5,  windowSeconds: 60  },
  register:        { maxRequests: 3,  windowSeconds: 60  },
  reset_password:  { maxRequests: 3,  windowSeconds: 300 },
  save_daily_log:  { maxRequests: 20, windowSeconds: 60  },
  medication_write:{ maxRequests: 30, windowSeconds: 60  },
  export_data:     { maxRequests: 3,  windowSeconds: 300 },
  delete_account:  { maxRequests: 2,  windowSeconds: 300 },
};

/**
 * Verifica o rate limit para uma ação.
 * Retorna true se a requisição é permitida, false se deve ser rejeitada.
 * Fail-open: erros de DB não bloqueiam o usuário.
 */
export async function checkRateLimit(
  action: string,
  userId: string,
): Promise<boolean> {
  const config = LIMITS[action];
  if (!config) return true;

  const key = `${action}:${userId}`;

  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_key: key,
      p_max_requests: config.maxRequests,
      p_window_seconds: config.windowSeconds,
    });
    if (error) return true; // fail-open
    return data !== false;
  } catch {
    return true; // fail-open
  }
}
