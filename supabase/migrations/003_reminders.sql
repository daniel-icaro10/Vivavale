-- ============================================================
-- VivaLeve — Migration 003: Reminder System Foundation
-- Data: 2026-05-13
--
-- Cria a infra de dados para o sistema de lembretes.
-- Esta migration NÃO implementa jobs de envio nem notificações.
-- Apenas persiste a intenção de lembrete de forma timezone-safe.
--
-- Tabelas criadas:
--   reminders                — lembretes vinculados a medicamentos
--   notification_preferences — preferências de notificação por usuário
--
-- Princípio arquitetural central:
--   time_local  = horário percebido pelo usuário (tipo time, no fuso local)
--   timezone    = IANA timezone snapshot do momento de criação/edição
--   next_trigger_at = UTC calculado a partir de time_local + timezone
--
-- next_trigger_at é mantido por:
--   - Server Actions (create/update) — cálculo inicial
--   - Edge Function futura (pós-envio) — avanço para próxima ocorrência
-- ============================================================

-- ============================================================
-- TABELA: reminders
-- ============================================================

CREATE TABLE IF NOT EXISTS public.reminders (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medication_id   uuid        NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,

  -- Horário local do lembrete (no timezone do usuário).
  -- Tipo time: armazenado como "HH:MM:SS", retornado como "HH:MM:SS".
  -- Representado como "HH:MM" no código TypeScript/formulário.
  time_local      time        NOT NULL,

  -- Snapshot do IANA timezone do usuário no momento de criação/edição.
  -- Mantido separado de profiles.timezone: o lembrete pode ter sido criado
  -- quando o usuário estava em outro fuso (viagem).
  -- Formato: 'America/Sao_Paulo', 'America/Manaus', 'America/Recife'.
  timezone        text        NOT NULL,

  -- Frequência de disparo.
  -- 'daily'         = todos os dias
  -- 'weekdays'      = segunda a sexta
  -- 'custom_future' = reservado para engine de recorrência futura (RRULE)
  recurrence      text        NOT NULL DEFAULT 'daily'
                  CHECK (recurrence IN ('daily', 'weekdays', 'custom_future')),

  -- Se false, o lembrete está pausado — mantido no banco para histórico.
  active          boolean     NOT NULL DEFAULT true,

  -- UTC do último envio bem-sucedido. NULL se ainda não enviado.
  -- Mantido pela Edge Function pós-envio.
  last_sent_at    timestamptz,

  -- UTC do próximo disparo planejado.
  -- Calculado em: time_local + timezone + recurrence.
  -- NULL até primeiro cálculo pelo Server Action.
  -- Mantido pela Edge Function após cada envio.
  next_trigger_at timestamptz,

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABELA: notification_preferences
-- 1:1 com auth.users. Criada lazily (upsert no primeiro acesso).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id              uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Controle global de lembretes para este usuário.
  -- false = todos os reminders são suspensos sem necessidade de editar cada um.
  reminders_enabled    boolean     NOT NULL DEFAULT true,

  -- Horário de início do período silencioso (local).
  -- Ex: '22:00' — notificações suprimidas a partir das 22h.
  -- NULL = sem período silencioso.
  quiet_hours_start    time,

  -- Horário de fim do período silencioso (local).
  -- Ex: '07:00' — notificações retomam às 07h.
  -- Pode ser < quiet_hours_start (período cruza meia-noite).
  -- Ex: start=22:00, end=07:00 → silencioso das 22h às 07h do dia seguinte.
  quiet_hours_end      time,

  -- Timezone usado para interpretar quiet_hours_start/end.
  -- Snapshot independente de profiles.timezone para uso direto pela Edge Function
  -- sem necessidade de JOIN com profiles.
  timezone             text        NOT NULL DEFAULT 'America/Sao_Paulo',

  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- ÍNDICES
-- ============================================================

-- Usado pelo cron job/Edge Function para buscar lembretes pendentes:
--   SELECT * FROM reminders WHERE active = true AND next_trigger_at <= now()
-- Índice parcial (só ativos) — eficiente mesmo com muitos inativos históricos.
CREATE INDEX IF NOT EXISTS reminders_next_trigger_idx
  ON public.reminders (next_trigger_at)
  WHERE active = true;

-- Listagem dos lembretes do usuário ordenada por horário:
--   WHERE user_id = $1 ORDER BY time_local
CREATE INDEX IF NOT EXISTS reminders_user_time_idx
  ON public.reminders (user_id, time_local);

-- Suporta cascades e queries por medicamento:
--   WHERE medication_id = $1
CREATE INDEX IF NOT EXISTS reminders_medication_idx
  ON public.reminders (medication_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.reminders              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- ---- reminders ----

DROP POLICY IF EXISTS "reminders_select_own" ON public.reminders;
CREATE POLICY "reminders_select_own"
  ON public.reminders FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "reminders_insert_own" ON public.reminders;
CREATE POLICY "reminders_insert_own"
  ON public.reminders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reminders_update_own" ON public.reminders;
CREATE POLICY "reminders_update_own"
  ON public.reminders FOR UPDATE
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reminders_delete_own" ON public.reminders;
CREATE POLICY "reminders_delete_own"
  ON public.reminders FOR DELETE
  USING (auth.uid() = user_id);

-- ---- notification_preferences ----

DROP POLICY IF EXISTS "notif_prefs_select_own" ON public.notification_preferences;
CREATE POLICY "notif_prefs_select_own"
  ON public.notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notif_prefs_insert_own" ON public.notification_preferences;
CREATE POLICY "notif_prefs_insert_own"
  ON public.notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notif_prefs_update_own" ON public.notification_preferences;
CREATE POLICY "notif_prefs_update_own"
  ON public.notification_preferences FOR UPDATE
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- TRIGGERS: updated_at
-- Reutiliza handle_updated_at() da migration 001.
-- ============================================================

CREATE OR REPLACE TRIGGER reminders_updated_at
  BEFORE UPDATE ON public.reminders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- VERIFICAÇÃO FINAL
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== [003] Reminder Foundation — migration concluída ===';
  RAISE NOTICE 'Tabelas: reminders, notification_preferences';
  RAISE NOTICE 'Índices: reminders_next_trigger_idx (parcial), reminders_user_time_idx, reminders_medication_idx';
  RAISE NOTICE 'RLS: habilitado em ambas as tabelas';
  RAISE NOTICE 'Triggers: updated_at em ambas as tabelas';
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANTE: next_trigger_at é calculado pelas Server Actions.';
  RAISE NOTICE 'A Edge Function de envio ainda não existe — reminders ficam';
  RAISE NOTICE 'armazenados mas não disparam notificações nesta fase.';
  RAISE NOTICE '=== [003] Fim ===';
END;
$$;
