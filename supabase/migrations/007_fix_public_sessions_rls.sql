-- ============================================================
-- VivaLeve — Migration 007: Corrigir RLS da tabela public_symptom_sessions
-- Data: 2026-05-13
--
-- PROBLEMA (auditoria Priority 0):
--   A policy SELECT "public_select_session" usa USING (true), que permite
--   qualquer cliente anônimo enumerar TODAS as sessões com um SELECT simples.
--   Embora o acesso correto seja por token, a RLS não enforça esse requisito.
--
-- SOLUÇÃO: capability-based access via função RPC.
--   1. Remove a policy SELECT vulnerável.
--   2. Cria função SECURITY DEFINER get_public_session_insights(uuid).
--      A função recebe o token, filtra pelo token internamente, e retorna
--      apenas o campo computed_insights — sem expor outros registros.
--   3. Garante que acesso direto à tabela (sem função) retorna vazio para anon.
--
-- INVARIANTES mantidos:
--   - INSERT permanece público (fluxo de análise pública não muda).
--   - A rota /results continua funcional via .rpc() em vez de .from().
--   - Nenhum dado de sessão fica acessível sem o token exato.
-- ============================================================

-- ============================================================
-- SEÇÃO 1 — Remover policy SELECT vulnerável
-- ============================================================

DROP POLICY IF EXISTS "public_select_session" ON public.public_symptom_sessions;

-- Sem policy SELECT, anon não consegue ler nenhuma linha diretamente
-- (RLS está habilitado na tabela desde a migration 005).

-- ============================================================
-- SEÇÃO 2 — Função RPC de acesso capability-based
--
-- SECURITY DEFINER: executa com os privilégios do owner da função
-- (tipicamente o role que criou o schema), contornando a RLS apenas
-- dentro do corpo da função. Isso permite o SELECT interno filtrado
-- sem expor SELECT geral ao anon.
--
-- SET search_path = public: defesa contra search_path injection.
--
-- Retorna NULL se o token não existe ou está malformado — sem revelar
-- se o token é inválido ou se simplesmente não há resultado.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_public_session_insights(p_token uuid)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT computed_insights
  FROM   public.public_symptom_sessions
  WHERE  session_token = p_token
  LIMIT  1;
$$;

-- Concede execução para os roles públicos do Supabase
GRANT EXECUTE ON FUNCTION public.get_public_session_insights(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_session_insights(uuid) TO authenticated;

-- ============================================================
-- SEÇÃO 3 — Verificação pós-migration
-- ============================================================

DO $$
BEGIN
  -- Confirma que a policy vulnerável foi removida
  IF EXISTS (
    SELECT 1
    FROM   pg_policies
    WHERE  tablename = 'public_symptom_sessions'
      AND  policyname = 'public_select_session'
  ) THEN
    RAISE EXCEPTION '[007] FALHA: policy public_select_session ainda existe.';
  END IF;

  -- Confirma que a função foi criada
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_proc p
    JOIN   pg_namespace n ON n.oid = p.pronamespace
    WHERE  n.nspname = 'public'
      AND  p.proname = 'get_public_session_insights'
  ) THEN
    RAISE EXCEPTION '[007] FALHA: função get_public_session_insights não foi criada.';
  END IF;

  RAISE NOTICE '[007] RLS corrigida com sucesso. SELECT direto bloqueado para anon. RPC disponível.';
END;
$$;
