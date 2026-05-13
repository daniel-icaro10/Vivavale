# MIGRATION GUIDELINES — VivaLeve
> **Status:** Oficial. Regras obrigatórias para criação e execução de migrations.
> **Última revisão:** 2026-05-13
> **Escopo:** Todas as migrations PostgreSQL via Supabase.

---

## 1. Princípios

### Migrations são imutáveis após execução

Uma migration executada em qualquer ambiente (staging, produção) **nunca é editada**. Problemas são resolvidos com uma nova migration que corrige o estado anterior.

**Por quê:** migrations aplicadas deixam o banco em um estado rastreável. Editar uma migration executada cria divergência silenciosa entre ambientes e destrói a auditabilidade.

```
# ❌ PROIBIDO
Editar 002_schema_corrections.sql após execução em staging

# ✅ CORRETO
Criar 004_fix_xyz.sql com a correção necessária
```

### Additive-first

Prefira operações aditivas sobre destrutivas:

| Aditivo (preferido) | Destrutivo (evitar) |
|---|---|
| `ADD COLUMN IF NOT EXISTS` | `DROP COLUMN` |
| `CREATE INDEX IF NOT EXISTS` | `DROP INDEX` (sem substituição) |
| `CREATE TABLE IF NOT EXISTS` | `DROP TABLE` |
| Renomear via DO block idempotente | `TRUNCATE` |

Operações destrutivas são permitidas quando necessárias (ex: `DROP INDEX` ao substituir por índice composto melhor), mas devem ser justificadas no comentário da migration.

### Sempre idempotente

Toda migration deve poder ser executada múltiplas vezes sem erro e sem alterar o estado resultante após a primeira execução bem-sucedida.

```sql
-- ✅ Idempotente
CREATE TABLE IF NOT EXISTS public.reminders ( ... );
ALTER TABLE public.medications ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;
CREATE INDEX IF NOT EXISTS reminders_user_time_idx ON public.reminders (user_id, time_local);
DROP POLICY IF EXISTS "policy_name" ON public.tabela;
CREATE OR REPLACE TRIGGER trigger_name ...;

-- ❌ Não idempotente — falha na segunda execução
CREATE TABLE public.reminders ( ... );
ALTER TABLE public.medications ADD COLUMN active boolean NOT NULL DEFAULT true;
CREATE INDEX reminders_user_time_idx ON public.reminders (user_id, time_local);
```

---

## 2. Nomenclatura e Ordenação

### Padrão de nome

```
{NNN}_{descricao_curta}.sql

NNN = número sequencial de 3 dígitos, zero-padded
```

| Migration | Conteúdo |
|---|---|
| `001_initial_schema.sql` | Schema base: profiles, daily_logs, medications |
| `002_schema_corrections.sql` | Correções: frequency, active, start_date, updated_at, timezone |
| `003_reminders.sql` | Reminders e notification_preferences |
| `004_notifications.sql` | Futuro: push_subscriptions, error_count |

**Regras:**
- Nunca usar datas no nome (migrations são ordenadas pelo número, não data)
- Descrição em snake_case, sem acentos
- Nunca reutilizar números de migrations dropadas

### Ordenação de dependências

Migrations são executadas em ordem numérica. Garantir que dependencies existam:

```
001 → cria profiles, daily_logs, medications
        ↓ cria handle_updated_at(), handle_new_user()
002 → modifica as tabelas de 001 (depende de 001)
        ↓ usa IF EXISTS/IF NOT EXISTS para idempotência
003 → cria reminders (FK → medications de 001+002)
        ↓ usa handle_updated_at() de 001
004 → modifica reminders de 003 (depende de 003)
```

**Nunca criar uma migration que depende de uma migration com número maior.**

---

## 3. Estrutura Obrigatória de uma Migration

```sql
-- ============================================================
-- VivaLeve — Migration {NNN}: {Título Descritivo}
-- Data: YYYY-MM-DD
--
-- {Descrição concisa do que esta migration faz e por quê}
--
-- Problemas resolvidos / Tabelas criadas:
--   [CRÍTICO/ALTO/MÉDIO] breve descrição
-- ============================================================

-- ============================================================
-- SEÇÃO 1 — {TABELA/OPERAÇÃO}
-- {Comentário explicando o racional da mudança}
-- ============================================================

{SQL idempotente}

-- ============================================================
-- VERIFICAÇÃO FINAL
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '=== [{NNN}] Migration concluída com sucesso ===';
END;
$$;
```

---

## 4. Idempotência por Tipo de Operação

### CREATE TABLE

```sql
CREATE TABLE IF NOT EXISTS public.tabela ( ... );
```

### ADD COLUMN

```sql
ALTER TABLE public.tabela ADD COLUMN IF NOT EXISTS coluna tipo constraints;
```

### DROP COLUMN

PostgreSQL não tem `DROP COLUMN IF EXISTS` até PostgreSQL 16 com condições específicas. Usar DO block:

```sql
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tabela' AND column_name = 'coluna'
  ) THEN
    ALTER TABLE public.tabela DROP COLUMN coluna;
  END IF;
END;
$$;
```

### RENAME COLUMN

PostgreSQL não tem `RENAME COLUMN IF EXISTS`. Usar DO block:

```sql
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'tabela'
      AND column_name  = 'nome_antigo'
  ) THEN
    ALTER TABLE public.tabela RENAME COLUMN nome_antigo TO nome_novo;
    RAISE NOTICE 'Coluna renomeada: nome_antigo → nome_novo';
  ELSE
    RAISE NOTICE 'Coluna nome_antigo não encontrada — skip';
  END IF;
END;
$$;
```

### CREATE INDEX

```sql
CREATE INDEX IF NOT EXISTS nome_idx ON public.tabela (col1, col2);
-- Com condição parcial:
CREATE INDEX IF NOT EXISTS nome_idx ON public.tabela (col1) WHERE active = true;
```

### DROP INDEX

```sql
DROP INDEX IF EXISTS public.nome_idx;
```

### RLS POLICIES

```sql
-- Sempre DROP antes do CREATE (CREATE POLICY não tem IF NOT EXISTS em PostgreSQL ≤15)
DROP POLICY IF EXISTS "policy_name" ON public.tabela;
CREATE POLICY "policy_name" ON public.tabela
  FOR SELECT USING (auth.uid() = user_id);
```

### TRIGGERS

```sql
-- CREATE OR REPLACE TRIGGER é idempotente (PostgreSQL 14+)
CREATE OR REPLACE TRIGGER trigger_name
  BEFORE UPDATE ON public.tabela
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

### ALTER COLUMN

```sql
-- Remover DEFAULT: idempotente (no-op se já não tiver)
ALTER TABLE public.tabela ALTER COLUMN coluna DROP DEFAULT;

-- Adicionar NOT NULL constraint: cuidado — falha se houver NULLs existentes
-- Verificar dados antes e usar DEFAULT para retrocompatibilidade
ALTER TABLE public.tabela ALTER COLUMN coluna SET NOT NULL;
```

---

## 5. Estratégia de Rollback

**O projeto NÃO usa rollback automático de migrations.**

Razão: Supabase não tem suporte nativo a rollback de migrations. Migrations destrutivas (DROP TABLE, DROP COLUMN) são irrecuperáveis sem backup.

**Estratégia adotada:**

1. Testar a migration localmente com `supabase db reset` antes de aplicar em staging
2. Aplicar em staging primeiro, verificar, então aplicar em produção
3. Em caso de erro em produção: criar migration de correção imediata (forward-only fix)
4. Manter backup do banco antes de migrations destrutivas

**Backup antes de migrations de risco:**

```bash
# Via Supabase CLI
supabase db dump -f backup_pre_migration_00N.sql

# Via Dashboard
# Project Settings → Database → Backups
```

---

## 6. Migrations e Dados Existentes

### ADD COLUMN com NOT NULL

Quando adicionar uma coluna `NOT NULL` em tabela com dados existentes, sempre incluir um `DEFAULT` para as linhas existentes:

```sql
-- ✅ CORRETO — linhas existentes recebem o default
ALTER TABLE public.medications
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- ❌ FALHA — linhas existentes ficam sem valor para coluna NOT NULL
ALTER TABLE public.medications
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL;
```

Se o default não é semanticamente correto para dados históricos, documentar no comentário:

```sql
-- Nota: linhas existentes recebem now() como updated_at.
-- Para dados históricos reais, executar após a migration:
--   UPDATE public.medications SET updated_at = created_at;
-- Em ambiente de desenvolvimento com dados de teste, o default é aceitável.
ALTER TABLE public.medications
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
```

### DROP DEFAULT

```sql
-- Remover default de coluna existente (migration 002 — daily_logs.date)
-- Esta operação é idempotente: no-op se o default já foi removido
ALTER TABLE public.daily_logs ALTER COLUMN date DROP DEFAULT;
```

---

## 7. Migrations de RLS

### Regras para policies

```sql
-- Sempre em pares: DROP IF EXISTS + CREATE
DROP POLICY IF EXISTS "tabela_operacao_own" ON public.tabela;
CREATE POLICY "tabela_operacao_own"
  ON public.tabela FOR {OPERAÇÃO}
  USING  (auth.uid() = user_id)     -- para SELECT, UPDATE, DELETE
  WITH CHECK (auth.uid() = user_id); -- para INSERT e UPDATE

-- Habilitar RLS ANTES de criar policies (idempotente)
ALTER TABLE public.tabela ENABLE ROW LEVEL SECURITY;
```

### Ordem das operações em uma nova tabela

```sql
-- 1. CREATE TABLE (com IF NOT EXISTS)
-- 2. CREATE INDEX IF NOT EXISTS
-- 3. ALTER TABLE ENABLE ROW LEVEL SECURITY
-- 4. DROP POLICY IF EXISTS + CREATE POLICY (por operação)
-- 5. CREATE OR REPLACE TRIGGER (updated_at)
```

---

## 8. Verificação Pós-Migration

Toda migration deve incluir um DO block de verificação ao final:

```sql
DO $$
DECLARE
  col RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== [{NNN}] Verificação pós-migration ===';

  -- Verificar colunas da tabela modificada
  FOR col IN
    SELECT column_name, data_type, is_nullable, column_default
    FROM   information_schema.columns
    WHERE  table_schema = 'public' AND table_name = 'tabela'
    ORDER  BY ordinal_position
  LOOP
    RAISE NOTICE '  % | % | nullable:% | default:%',
      col.column_name, col.data_type, col.is_nullable,
      COALESCE(col.column_default, 'none');
  END LOOP;

  RAISE NOTICE '=== [{NNN}] Concluída ===';
END;
$$;
```

O output de `RAISE NOTICE` aparece no log do Supabase Dashboard ao executar a migration, permitindo verificação visual imediata.

---

## 9. Checklist antes de aplicar em produção

```
[ ] Migration testada localmente com supabase db reset
[ ] Migration é idempotente (testada duas vezes sem erro)
[ ] Todas as operações têm IF EXISTS / IF NOT EXISTS onde aplicável
[ ] RENAME usa DO block com information_schema check
[ ] ADD COLUMN NOT NULL tem DEFAULT para linhas existentes
[ ] Policies seguem o padrão: DROP IF EXISTS + CREATE
[ ] ENABLE ROW LEVEL SECURITY está antes das policies
[ ] Trigger usa CREATE OR REPLACE
[ ] Verificação final com RAISE NOTICE incluída
[ ] tsc --noEmit passa com zero erros após atualizar database.ts
[ ] database.ts atualizado para refletir o novo schema
[ ] Migration aplicada em staging primeiro
[ ] Backup do banco feito antes de migrations destrutivas
```

---

## 10. O que Nunca Fazer

```sql
-- ❌ NUNCA editar migrations já executadas
-- (qualquer arquivo em supabase/migrations/ que já foi aplicado)

-- ❌ NUNCA usar TRUNCATE em migrations
TRUNCATE public.daily_logs;

-- ❌ NUNCA usar DROP TABLE sem substituição planejada
DROP TABLE public.medications;

-- ❌ NUNCA depender de ordem de colunas
-- PostgreSQL garante apenas a existência das colunas, não a ordem

-- ❌ NUNCA usar DEFAULT CURRENT_DATE para campos de data local
ALTER TABLE public.logs ADD COLUMN date date NOT NULL DEFAULT CURRENT_DATE;

-- ❌ NUNCA criar migrations sem testar localmente primeiro

-- ❌ NUNCA usar timestamp sem timezone
ALTER TABLE public.tabela ADD COLUMN ts timestamp; -- deve ser timestamptz

-- ❌ NUNCA usar ENUM do PostgreSQL (usar CHECK IN ao invés)
CREATE TYPE status AS ENUM ('active', 'inactive');
```
