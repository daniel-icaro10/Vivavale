-- ============================================================
-- VivaLeve — Migration 002: Schema Stabilization
-- Data: 2026-05-13
--
-- Corrige divergências identificadas na auditoria do schema.
-- Idempotente: seguro de executar em qualquer ordem após a 001.
--
-- Problemas resolvidos:
--   [CRÍTICO] medications.schedule → frequency + active + start_date
--   [ALTO]    daily_logs.date DEFAULT CURRENT_DATE removido (bug timezone)
--   [ALTO]    updated_at adicionado em daily_logs e medications
--   [ALTO]    profiles.timezone adicionado (pré-requisito reminders)
--   [MÉDIO]   Índice de medications substituído por composto
--   [MÉDIO]   Policy DELETE desnecessária em daily_logs removida
-- ============================================================

-- ============================================================
-- SEÇÃO 1 — TABELA: medications
--
-- A migration 001 define a coluna como `schedule` (texto legado).
-- Todo o código TypeScript e Server Actions usam `frequency`.
-- Adicionados também: active, start_date, updated_at.
-- ============================================================

-- 1a. Renomear schedule → frequency.
--     Usa DO block porque não existe ALTER TABLE RENAME COLUMN IF EXISTS.
--     Verifica presença antes de renomear para garantir idempotência.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM   information_schema.columns
    WHERE  table_schema = 'public'
      AND  table_name   = 'medications'
      AND  column_name  = 'schedule'
  ) THEN
    ALTER TABLE public.medications RENAME COLUMN schedule TO frequency;
    RAISE NOTICE '[002] medications.schedule renomeado para frequency.';
  ELSE
    RAISE NOTICE '[002] medications.schedule não encontrado — já migrado ou inexistente. Skip.';
  END IF;
END;
$$;

-- 1b. Garantir que frequency existe (caso de ambiente sem migration 001,
--     ou que nunca teve a coluna schedule).
ALTER TABLE public.medications
  ADD COLUMN IF NOT EXISTS frequency text;

-- 1c. active: controla se o usuário ainda usa o medicamento (true) ou
--     se é registro histórico (false). DEFAULT true porque todo medicamento
--     recém-cadastrado está em uso.
ALTER TABLE public.medications
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

-- 1d. start_date: data de início do uso. Opcional (NULL = não informado).
--     Tipo date (sem hora) porque representa uma data no calendário do usuário,
--     não um instante no tempo.
ALTER TABLE public.medications
  ADD COLUMN IF NOT EXISTS start_date date;

-- 1e. updated_at: rastreabilidade de edições. Preenchido automaticamente
--     pelo trigger medications_updated_at definido na Seção 4.
--     Linhas existentes recebem now() como valor inicial — aceitável porque
--     não há dados de produção. Em ambiente com dados reais, executar:
--     UPDATE public.medications SET updated_at = created_at;
ALTER TABLE public.medications
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- ============================================================
-- SEÇÃO 2 — TABELA: daily_logs
--
-- Dois problemas:
--   a) DEFAULT CURRENT_DATE usa data UTC do servidor — incorreto para BR.
--   b) Ausência de updated_at impede auditoria de edições via UPSERT.
-- ============================================================

-- 2a. Remover DEFAULT CURRENT_DATE da coluna date.
--
--     PROBLEMA REAL: usuário em São Paulo (UTC-3) usa o app às 22:30 de
--     terça-feira. No servidor (UTC) já são 01:30 de quarta-feira.
--     Se o banco gerasse a data, o registro seria datado incorretamente.
--
--     SOLUÇÃO: data é sempre enviada pelo cliente como string 'YYYY-MM-DD'
--     representando "hoje" no timezone do dispositivo do usuário.
--     O banco apenas persiste sem interferência.
--
--     Esta operação é no-op se a coluna já não tiver DEFAULT.
ALTER TABLE public.daily_logs
  ALTER COLUMN date DROP DEFAULT;

-- 2b. updated_at: rastreabilidade de quando um log foi editado vs. criado.
--     A Server Action usa UPSERT — sem updated_at, edições são invisíveis.
--     Necessário para analytics futuros ("editou o log de ontem?").
ALTER TABLE public.daily_logs
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- ============================================================
-- SEÇÃO 3 — TABELA: profiles
--
-- timezone: necessário para calcular horários de reminders no timezone
-- local do usuário. Sem este campo, um reminder configurado para "08:00"
-- dispararia às 08:00 UTC (05:00 em Brasília).
--
-- DEFAULT 'America/Sao_Paulo': timezone da maioria dos usuários brasileiros.
-- O usuário pode atualizar este campo nas configurações.
-- Formato: identificador IANA (ex: 'America/Manaus', 'America/Recife').
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'America/Sao_Paulo';

-- ============================================================
-- SEÇÃO 4 — TRIGGERS: updated_at
--
-- A função handle_updated_at() já existe na migration 001.
-- CREATE OR REPLACE TRIGGER é idempotente (recria se existir).
--
-- Estratégia: um único trigger por tabela, executado BEFORE UPDATE,
-- garantindo que updated_at sempre reflete o momento da última
-- modificação independente de qual coluna foi alterada.
-- ============================================================

-- Trigger para daily_logs
CREATE OR REPLACE TRIGGER daily_logs_updated_at
  BEFORE UPDATE ON public.daily_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger para medications
CREATE OR REPLACE TRIGGER medications_updated_at
  BEFORE UPDATE ON public.medications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Nota: profiles já tem o trigger profiles_updated_at da migration 001.
-- reminders e notification_preferences terão seus próprios triggers
-- quando forem criados na Fase 6A.

-- ============================================================
-- SEÇÃO 5 — ÍNDICES
--
-- O índice simples medications_user_idx ON (user_id) não cobre
-- o ORDER BY active DESC, created_at DESC usado pela listagem.
-- Cada query de listagem executava um sort adicional no heap.
--
-- O índice composto cobre o filtro AND o critério de ordenação
-- em uma única operação de índice.
-- ============================================================

-- Remover índice simples (substituído pelo composto abaixo)
DROP INDEX IF EXISTS public.medications_user_idx;

-- Índice composto alinhado com a query de listagem:
-- WHERE user_id = $1 ORDER BY active DESC, created_at DESC
CREATE INDEX IF NOT EXISTS medications_user_active_idx
  ON public.medications (user_id, active DESC, created_at DESC);

-- ============================================================
-- SEÇÃO 6 — RLS: remover policy desnecessária
--
-- daily_logs não tem caso de uso legítimo para DELETE na aplicação.
-- O fluxo correto é UPSERT (criar ou atualizar o registro do dia).
-- Manter a policy exposição desnecessária sem benefício funcional.
--
-- Nota de segurança: mesmo sem a policy, o RLS permanece habilitado
-- na tabela — o que significa que DELETE sem policy = negado por padrão.
-- Remover a policy é, portanto, um endurecimento, não um relaxamento.
-- ============================================================

DROP POLICY IF EXISTS "daily_logs_delete_own" ON public.daily_logs;

-- ============================================================
-- VERIFICAÇÃO FINAL
-- Exibe estrutura resultante das tabelas modificadas para
-- confirmação visual após execução.
-- ============================================================

DO $$
DECLARE
  col RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== [002] Verificação pós-migration ===';

  RAISE NOTICE '';
  RAISE NOTICE '--- medications ---';
  FOR col IN
    SELECT column_name, data_type, is_nullable, column_default
    FROM   information_schema.columns
    WHERE  table_schema = 'public' AND table_name = 'medications'
    ORDER  BY ordinal_position
  LOOP
    RAISE NOTICE '  % | % | nullable:% | default:%',
      col.column_name, col.data_type, col.is_nullable, COALESCE(col.column_default, 'none');
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '--- daily_logs ---';
  FOR col IN
    SELECT column_name, data_type, is_nullable, column_default
    FROM   information_schema.columns
    WHERE  table_schema = 'public' AND table_name = 'daily_logs'
    ORDER  BY ordinal_position
  LOOP
    RAISE NOTICE '  % | % | nullable:% | default:%',
      col.column_name, col.data_type, col.is_nullable, COALESCE(col.column_default, 'none');
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '--- profiles ---';
  FOR col IN
    SELECT column_name, data_type, is_nullable, column_default
    FROM   information_schema.columns
    WHERE  table_schema = 'public' AND table_name = 'profiles'
    ORDER  BY ordinal_position
  LOOP
    RAISE NOTICE '  % | % | nullable:% | default:%',
      col.column_name, col.data_type, col.is_nullable, COALESCE(col.column_default, 'none');
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '=== [002] Migration concluída com sucesso ===';
END;
$$;
