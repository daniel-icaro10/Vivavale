-- ============================================================
-- VivaLeve — Migration 008: Rate Limiting para Server Actions
-- Data: 2026-05-13
--
-- Cria a tabela rate_limits e a função check_rate_limit para
-- limitar requisições abusivas nas Server Actions do Next.js.
--
-- Estratégia: sliding window por chave (action:userId ou action:ipHash).
-- Funciona cross-serverless porque persiste no Postgres.
-- ============================================================

-- ============================================================
-- SEÇÃO 1 — Tabela rate_limits
-- ============================================================

CREATE TABLE IF NOT EXISTS public.rate_limits (
  key         text        NOT NULL,
  window_start timestamptz NOT NULL,
  count       integer     NOT NULL DEFAULT 1,
  CONSTRAINT rate_limits_pkey PRIMARY KEY (key, window_start)
);

-- TTL automático: registros expirados não precisam de job manual.
-- O índice abaixo acelera o DELETE de limpeza dentro da função.
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start
  ON public.rate_limits (window_start);

-- Somente o service_role (usado pelas Server Actions via admin client) acessa.
-- anon e authenticated não têm acesso direto — apenas via RPC SECURITY DEFINER.
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Nenhuma policy: bloqueia acesso direto para todos os roles.
-- Acesso exclusivo via função check_rate_limit abaixo.

-- ============================================================
-- SEÇÃO 2 — Função check_rate_limit
--
-- Retorna true  → requisição permitida (contador incrementado).
-- Retorna false → limite atingido, requisição deve ser rejeitada.
--
-- Parâmetros:
--   p_key             — identificador único: "action:userId" ou "action:ipHash"
--   p_max_requests    — máximo de requisições permitidas na janela
--   p_window_seconds  — tamanho da janela em segundos
--
-- Segurança:
--   SECURITY DEFINER: executa com privilégio do owner, não do caller.
--   SET search_path = public: defesa contra search_path injection.
--   Não expõe dados de outros usuários — apenas incrementa/verifica.
-- ============================================================

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key            text,
  p_max_requests   integer,
  p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start timestamptz;
  v_count        integer;
BEGIN
  -- Janela atual: trunca ao início da janela de p_window_seconds segundos
  v_window_start := date_trunc('second', now()) -
    make_interval(secs => (
      EXTRACT(EPOCH FROM now())::bigint % p_window_seconds
    )::float);

  -- Remove janelas antigas (limpeza inline — evita acúmulo)
  DELETE FROM public.rate_limits
  WHERE key = p_key
    AND window_start < v_window_start;

  -- Upsert atômico: incrementa ou cria com FOR UPDATE implícito via ON CONFLICT
  INSERT INTO public.rate_limits (key, window_start, count)
  VALUES (p_key, v_window_start, 1)
  ON CONFLICT (key, window_start)
  DO UPDATE SET count = rate_limits.count + 1
  RETURNING count INTO v_count;

  RETURN v_count <= p_max_requests;
END;
$$;

-- Concede execução aos roles que as Server Actions usam
-- anon incluso para rate-limit em actions pré-autenticação (login, register)
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer)
  TO anon, authenticated, service_role;

-- ============================================================
-- SEÇÃO 3 — Verificação pós-migration
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'rate_limits'
  ) THEN
    RAISE EXCEPTION '[008] FALHA: tabela rate_limits não foi criada.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'check_rate_limit'
  ) THEN
    RAISE EXCEPTION '[008] FALHA: função check_rate_limit não foi criada.';
  END IF;

  RAISE NOTICE '[008] Rate limiting configurado com sucesso.';
END;
$$;
