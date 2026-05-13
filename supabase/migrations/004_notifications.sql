-- ============================================================
-- VivaLeve — Migration 004: Push Notification Infrastructure
-- Data: 2026-05-13
--
-- Esta migration finaliza a infra de notificações reais:
--
-- 1. Tabela push_subscriptions  — armazena endpoints Web Push por dispositivo
-- 2. Alter reminders            — tracking de erros de entrega
-- 3. Índices                    — queries eficientes para o scheduler
--
-- Arquitetura de push:
--   - VAPID keys ficam como Supabase Edge Function secrets (nunca no banco)
--   - A Edge Function send-reminders lê push_subscriptions para entregar
--   - Cada dispositivo tem uma subscription separada (1 user : N devices)
--   - Subscriptions inválidas (expiradas/revogadas) são removidas por cleanup-subscriptions
-- ============================================================

-- ============================================================
-- TABELA: push_subscriptions
-- Armazena os endpoints Web Push por user+dispositivo.
-- Um usuário pode ter múltiplas subscriptions (multi-device).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Endpoint único do push service do browser (URL completa).
  -- Globalmente único: cada browser install gera um endpoint diferente.
  endpoint    text        NOT NULL UNIQUE,

  -- Chaves ECDH para criptografia da payload (base64url, sem padding).
  p256dh_key  text        NOT NULL,
  auth_key    text        NOT NULL,

  -- Identificação do dispositivo (user-agent truncado em 200 chars).
  -- Apenas para UI informativa — não afeta entrega.
  user_agent  text,

  -- false = subscription foi revogada ou expirou — não tentar entregar.
  active      boolean     NOT NULL DEFAULT true,

  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- ALTER: reminders — tracking de erros de entrega
-- ============================================================

ALTER TABLE public.reminders
  ADD COLUMN IF NOT EXISTS last_error      text,
  ADD COLUMN IF NOT EXISTS error_count     int  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_attempt_at timestamptz;

-- ============================================================
-- ÍNDICES
-- ============================================================

-- Scheduler: busca reminders vencidos e ativos
-- Partial index — só indexa ativos, reduz tamanho e melhora performance
CREATE INDEX IF NOT EXISTS reminders_next_trigger_idx
  ON public.reminders (next_trigger_at ASC)
  WHERE active = true AND next_trigger_at IS NOT NULL;

-- Entrega: busca subscriptions ativas por usuário
CREATE INDEX IF NOT EXISTS push_subscriptions_user_active_idx
  ON public.push_subscriptions (user_id)
  WHERE active = true;

-- Cleanup: subscriptions inativas (para limpeza periódica)
CREATE INDEX IF NOT EXISTS push_subscriptions_inactive_idx
  ON public.push_subscriptions (updated_at ASC)
  WHERE active = false;

-- ============================================================
-- TRIGGER: updated_at automático para push_subscriptions
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER push_subscriptions_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- RLS: push_subscriptions
-- ============================================================

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Usuário vê apenas suas próprias subscriptions
CREATE POLICY "Users view own push_subscriptions"
  ON public.push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Usuário insere apenas para si mesmo
CREATE POLICY "Users insert own push_subscriptions"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuário atualiza apenas suas próprias subscriptions
CREATE POLICY "Users update own push_subscriptions"
  ON public.push_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- Usuário remove apenas suas próprias subscriptions
CREATE POLICY "Users delete own push_subscriptions"
  ON public.push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- COMENTÁRIO sobre pg_cron para o scheduler
-- ============================================================
-- Para ativar o scheduler automático via pg_cron no Supabase:
--
--   SELECT cron.schedule(
--     'send-reminders',
--     '* * * * *',  -- a cada minuto
--     $$ SELECT net.http_post(
--       url := 'https://<project-ref>.supabase.co/functions/v1/send-reminders',
--       headers := jsonb_build_object(
--         'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key'),
--         'Content-Type', 'application/json'
--       ),
--       body := '{}'::jsonb
--     ) $$
--   );
--
-- Ative pg_cron em: Database → Extensions → pg_cron
-- A invocação da Edge Function via pg_cron é opcional —
-- alternativamente, use Supabase Scheduled Functions no painel.
-- ============================================================
