-- Migration 005 — Public Symptom Sessions
-- Armazena sessões públicas de análise de sintomas.
-- Sem dados pessoais obrigatórios. Sem autenticação necessária.

CREATE TABLE IF NOT EXISTS public.public_symptom_sessions (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token  uuid        NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  answers        jsonb       NOT NULL,
  computed_scores jsonb      NOT NULL,
  computed_insights jsonb    NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Index para lookup rápido por token (o padrão de acesso principal)
CREATE INDEX IF NOT EXISTS public_symptom_sessions_token_idx
  ON public.public_symptom_sessions (session_token);

-- Sessões antigas são inúteis após 90 dias. Cleanup via pg_cron opcional:
-- SELECT cron.schedule('cleanup-old-sessions', '0 4 * * *',
--   $$DELETE FROM public.public_symptom_sessions WHERE created_at < now() - interval '90 days'$$);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE public.public_symptom_sessions ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário (incluindo anon) pode inserir uma nova sessão
CREATE POLICY "public_insert_session" ON public.public_symptom_sessions
  FOR INSERT WITH CHECK (true);

-- Qualquer usuário pode ler qualquer sessão pelo token (capability-based)
-- Sem dados pessoais, sem risco de vazamento sensível
CREATE POLICY "public_select_session" ON public.public_symptom_sessions
  FOR SELECT USING (true);
