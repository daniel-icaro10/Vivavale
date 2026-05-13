-- ============================================================
-- VivaLeve — Migration 009: pg_cron + pg_net para send-reminders
-- Data: 2026-05-13
--
-- Configura o disparo automático da Edge Function send-reminders
-- a cada minuto via pg_cron + pg_net.
--
-- Pré-requisitos:
--   - Extensões pg_cron e pg_net habilitadas no projeto Supabase.
--   - Edge Function send-reminders deployada.
--   - Segredo SUPABASE_SERVICE_ROLE_KEY disponível.
--
-- IMPORTANTE: substituir <PROJECT_REF> pelo ref real do projeto
-- Supabase antes de aplicar esta migration em produção.
-- Em desenvolvimento local, usar a URL do Supabase local.
-- ============================================================

-- ============================================================
-- SEÇÃO 1 — Garantir extensões necessárias
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA cron;
CREATE EXTENSION IF NOT EXISTS pg_net  WITH SCHEMA extensions;

-- ============================================================
-- SEÇÃO 2 — Remover job anterior se existir (idempotência)
-- ============================================================

SELECT cron.unschedule('send-reminders-every-minute')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'send-reminders-every-minute'
);

-- ============================================================
-- SEÇÃO 3 — Agendar invocação da Edge Function a cada minuto
--
-- A função http_post do pg_net é assíncrona: não bloqueia o cron.
-- O header Authorization usa a service_role key para que a Edge
-- Function possa verificar a origem (se necessário).
--
-- Substituir <PROJECT_REF> pelo identificador real do projeto.
-- Exemplo: abcdefghijklmnop (16 caracteres alfanuméricos).
-- ============================================================

SELECT cron.schedule(
  'send-reminders-every-minute',
  '* * * * *',
  $$
    SELECT extensions.http_post(
      url     => 'https://<PROJECT_REF>.supabase.co/functions/v1/send-reminders',
      headers => jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
      ),
      body    => '{}'::jsonb
    );
  $$
);

-- ============================================================
-- SEÇÃO 4 — Alternativa local (desenvolvimento)
--
-- Para uso com `supabase start` local, criar o job apontando para
-- http://localhost:54321/functions/v1/send-reminders.
-- Não executar esta seção em produção.
-- ============================================================

-- SELECT cron.schedule(
--   'send-reminders-every-minute-local',
--   '* * * * *',
--   $$
--     SELECT extensions.http_post(
--       url     => 'http://localhost:54321/functions/v1/send-reminders',
--       headers => jsonb_build_object('Content-Type', 'application/json'),
--       body    => '{}'::jsonb
--     );
--   $$
-- );

-- ============================================================
-- SEÇÃO 5 — Verificação pós-migration
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'send-reminders-every-minute'
  ) THEN
    RAISE EXCEPTION '[009] FALHA: job send-reminders-every-minute não foi criado.';
  END IF;

  RAISE NOTICE '[009] pg_cron configurado: send-reminders disparado a cada minuto.';
END;
$$;
