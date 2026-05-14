-- ============================================================
-- VivaLeve — Migration 010: Error tracking em push_subscriptions
-- Data: 2026-05-14
--
-- A Edge Function send-reminders rastreia falhas por subscription
-- (por dispositivo) e desativa automaticamente subscriptions
-- que ultrapassam MAX_ERRORS tentativas.
--
-- Problema: migration 004 adicionou error_count e last_error
-- à tabela reminders (incorretamente). As colunas pertencem a
-- push_subscriptions, que é quem representa cada dispositivo.
--
-- Esta migration:
--   1. Adiciona error_count e last_error a push_subscriptions.
--   2. Adiciona last_sent_at a reminders (usada pela edge function
--      para registrar o momento do último envio bem-sucedido).
-- ============================================================

-- ============================================================
-- SEÇÃO 1 — push_subscriptions: error tracking por dispositivo
-- ============================================================

ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS error_count  int  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error   text;

-- Índice para o cleanup: encontra subscriptions com muitos erros
CREATE INDEX IF NOT EXISTS push_subscriptions_error_count_idx
  ON public.push_subscriptions (error_count)
  WHERE error_count > 0;

-- ============================================================
-- SEÇÃO 2 — reminders: last_sent_at para tracking de entrega
-- ============================================================

ALTER TABLE public.reminders
  ADD COLUMN IF NOT EXISTS last_sent_at timestamptz;

-- ============================================================
-- SEÇÃO 3 — Verificação pós-migration
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'push_subscriptions'
      AND column_name  = 'error_count'
  ) THEN
    RAISE EXCEPTION '[010] FALHA: coluna error_count não foi adicionada a push_subscriptions.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'reminders'
      AND column_name  = 'last_sent_at'
  ) THEN
    RAISE EXCEPTION '[010] FALHA: coluna last_sent_at não foi adicionada a reminders.';
  END IF;

  RAISE NOTICE '[010] Error tracking configurado com sucesso.';
END;
$$;
