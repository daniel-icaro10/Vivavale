# Database Audit Report — VivaLeve

> **Data:** 2026-05-13  
> **Escopo:** Migration SQL, Types TypeScript, Server Actions, Zod Schemas, RLS Policies  
> **Auditado por:** Arquitetura sênior — análise completa do estado real vs. estado desejado

---

## 1. DATABASE AUDIT REPORT

### Sumário executivo

O schema atual tem **1 problema crítico de blocking** (impede produção), **3 problemas de alto impacto** (causam bugs silenciosos ou bloqueiam features planejadas) e **8 problemas de médio/baixo impacto** (técnica da dívida acumulada). A fundação de segurança (RLS, Server Actions, defense in depth) está correta e bem implementada. O esforço de correção antes do primeiro deploy real é estimado em 1 migration SQL + 1 atualização de `database.ts`.

---

### Problemas encontrados

#### CRÍTICO

| ID | Problema | Severidade | Impacto |
|---|---|---|---|
| C-01 | `medications` na migration 001 tem coluna `schedule` em vez de `frequency`, sem `active` e sem `start_date` | **CRÍTICO** | Toda a feature de medicamentos não funciona contra o banco real |

**Detalhe C-01:**

```
Migration 001 define:                  Código (database.ts) espera:
─────────────────────                  ────────────────────────────
schedule text                          frequency text
(sem active)                           active boolean NOT NULL DEFAULT true
(sem start_date)                       start_date date
```

Se executar a migration 001 hoje e apontar o app para esse banco, todas as operações de `createMedicationAction` e `updateMedicationAction` falharão silenciosamente ou retornarão erro de coluna inexistente. O Server Action escreve `frequency`, `active`, `start_date` — campos que não existem na tabela.

---

#### ALTO

| ID | Problema | Severidade | Impacto |
|---|---|---|---|
| A-01 | `DEFAULT CURRENT_DATE` em `daily_logs.date` usa data UTC do servidor | **ALTO** | Registros datados erroneamente para usuários brasileiros após 21h |
| A-02 | `daily_logs` e `medications` não têm `updated_at` | **ALTO** | Sem rastreabilidade de edições; bloqueia analytics futuros |
| A-03 | `profiles.timezone` não existe nem na migration nem nos types | **ALTO** | Bloqueia toda a arquitetura de reminders (Fase 6A) |

**Detalhe A-01:**

```
Usuário em São Paulo: 22:30 de terça-feira
Servidor UTC:         01:30 de quarta-feira

DEFAULT CURRENT_DATE → registra "quarta-feira"
Correto:             → deve registrar "terça-feira"
```

A Server Action atual (`saveDailyLogAction`) envia `date: parsed.data.date` explicitamente — o que é correto. O problema é o `DEFAULT` residual na migration, que pode ser invocado em outras situações (insert direto, trigger, ou schema futuro). Deve ser removido.

**Detalhe A-02:**

A função `handle_updated_at()` já existe na migration 001 (usada por `profiles`). Não foi aplicada a `daily_logs` nem a `medications`. Cada UPSERT em `daily_logs` ou UPDATE em `medications` é invisível: não há como saber quando um registro foi editado vs. criado.

Impactos futuros:
- Dashboard: "você editou esse registro hoje" → impossível sem `updated_at`
- Analytics: distinguir registros criados vs. editados → impossível
- Debug: "por que esse dado mudou?" → sem trilha de auditoria

---

#### MÉDIO

| ID | Problema | Severidade | Impacto |
|---|---|---|---|
| M-01 | Índice `medications_user_idx ON (user_id)` não cobre `ORDER BY active DESC, created_at DESC` | MÉDIO | Sort extra em cada listagem de medicamentos |
| M-02 | `SELECT *` no histórico: puxa coluna `notes` (texto livre) desnecessariamente | MÉDIO | Transferência excessiva em queries de listagem futura |
| M-03 | `SaveStatus` duplicado entre `daily-log/types.ts` e `medications/types.ts` | MÉDIO | Drift de definição; dois tipos que deveriam ser um |
| M-04 | Sem soft delete em nenhuma tabela | MÉDIO | Deleção acidental de medicamento = perda permanente |
| M-05 | `daily_logs` tem policy de DELETE habilitada sem uso na UI | MÉDIO | Surface de ataque desnecessária; sem caso de uso legítimo |
| M-06 | `HISTORY_LIMIT = 30` hardcoded sem cursor pagination | MÉDIO | UX limitada; usuários com histórico longo não veem dados antigos |
| M-07 | `WeeklySummary` em `app.ts` é um tipo órfão sem tabela ou view correspondente | MÉDIO | Tipo que não pode ser gerado do banco; confusão futura |
| M-08 | Sem CHECK de tamanho de texto no banco para campos críticos | BAIXO | Bypass do Zod via acesso direto à API insere dados sem limite |

---

#### BAIXO / OBSERVAÇÕES

| ID | Observação |
|---|---|
| B-01 | `profiles` trigger usa `COALESCE(raw_user_meta_data->>'name', 'Usuário')` — defensivo e correto, mas o fallback 'Usuário' não tem rastreamento de se veio do fallback ou do usuário real |
| B-02 | `auth/schemas.ts` valida senha com `min(8)` no register mas mensagem de erro do backend diz "pelo menos 6 caracteres" (divergência de mensagens, não de comportamento) |
| B-03 | `notes` em `DailyLog` é `string \| null` no banco mas Zod produz `string \| undefined` — a conversão `?? null` na action está correta mas o tipo `DailyLogFormData` e o tipo `DailyLog` são incompatíveis sem essa conversão |
| B-04 | `daily_logs` não tem índice isolado em `date` — queries de range temporal sem `user_id` (impossíveis via RLS, mas possíveis via `service_role` em jobs futuros) não usariam o índice composto |

---

### Mapa de severidade

```
CRÍTICO  ██████████  C-01 (migration quebrada)
ALTO     ████████    A-01 (timezone), A-02 (updated_at), A-03 (profiles.timezone)
MÉDIO    ██████      M-01..M-08
BAIXO    ████        B-01..B-04
```

---

## 2. RECOMMENDED REFACTOR PLAN

### Princípio de priorização

Corrija antes do primeiro deploy real. Não existe banco em produção ainda — o custo de correção agora é um arquivo SQL. O custo de correção após ter dados em produção envolve backfill, downtime, e risco de perda de dados.

---

### Ordem de execução

#### SPRINT 1 — Antes de qualquer deploy (migration 002)

**Risco:** Zero. Banco não está em produção.

**Prioridade 1 — Correção da tabela `medications`**

A migration 001 deve ser corrigida OU uma migration 002 deve corrigir o estado. Como o banco não está em produção, a opção mais limpa é reescrever a migration 001 diretamente. Alternativa: criar migration 002 com `ALTER TABLE`.

```
Ação: reescrever 001_initial_schema.sql com medications correto
      OU criar 002_fix_medications.sql com ALTER TABLE
```

**Prioridade 2 — Remover `DEFAULT CURRENT_DATE` de `daily_logs.date`**

```
ALTER TABLE public.daily_logs ALTER COLUMN date DROP DEFAULT;
```

**Prioridade 3 — Adicionar `updated_at` em `daily_logs` e `medications`**

```
ALTER TABLE public.daily_logs ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.medications ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
+ triggers usando a função handle_updated_at() já existente
```

**Prioridade 4 — Adicionar `timezone` em `profiles`**

```
ALTER TABLE public.profiles ADD COLUMN timezone text NOT NULL DEFAULT 'America/Sao_Paulo';
```

**Prioridade 5 — Substituir índice de `medications`**

```
DROP INDEX medications_user_idx;
CREATE INDEX medications_user_active_idx ON public.medications (user_id, active DESC, created_at DESC);
```

**Prioridade 6 — Remover policy de DELETE em `daily_logs`**

Não existe caso de uso para deletar um log diário. A policy expõe uma operação sem intenção.

```
DROP POLICY "daily_logs_delete_own" ON public.daily_logs;
```

---

#### SPRINT 2 — Antes da Fase 6A (Reminders)

**Risco:** Baixo se feito antes de ter dados de usuário real.

- Criar tabela `reminders` com estrutura documentada em `database-architecture.md`
- Criar tabela `notification_preferences`
- Atualizar `database.ts` com os novos tipos

---

#### SPRINT 3 — Quando o histórico crescer (V2)

**Risco:** Médio. Usuários com dados existentes.

- Implementar cursor pagination na history query (substituir `LIMIT 30` por cursor `WHERE date < $cursor ORDER BY date DESC LIMIT 30`)
- Adicionar `deleted_at timestamptz` em `medications` para soft delete

---

#### SPRINT 4 — Quando analytics for implementado

**Risco:** Médio-alto. Requer backfill de dados e possivelmente downtime.

- Avaliar materialized view para `weekly_summaries`
- Avaliar particionamento de `daily_logs` por `user_id` (apenas se > 10M rows)

---

### Impacto no frontend por mudança

| Mudança | Impacto no frontend |
|---|---|
| Corrigir `medications` na migration | Zero — `database.ts` já tem o schema correto |
| Remover `DEFAULT` de `date` | Zero — Server Action já envia `date` explicitamente |
| Adicionar `updated_at` em logs e medicamentos | Mínimo — adicionar campo em `database.ts`; UI pode exibir "editado em" no futuro |
| Adicionar `timezone` em profiles | Mínimo — adicionar campo em `database.ts`; UI de configuração na Fase 6A |
| Substituir índice de medications | Zero — transparente para o código |
| Remover policy DELETE em daily_logs | Zero — UI nunca expôs essa operação |

---

## 3. IMPROVED DATABASE STRUCTURE

### Schema alvo — migration 002

Esta é a estrutura completa que deve existir após a migration 002. Serve como referência para reescrever a 001 ou criar a 002.

---

#### `profiles`

```sql
CREATE TABLE IF NOT EXISTS public.profiles (
  id         uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text        NOT NULL,
  age        integer     CHECK (age > 0 AND age < 120),
  diagnosis  text,
  timezone   text        NOT NULL DEFAULT 'America/Sao_Paulo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

Mudanças vs. migration 001: `+ timezone text NOT NULL DEFAULT 'America/Sao_Paulo'`

---

#### `daily_logs`

```sql
CREATE TABLE IF NOT EXISTS public.daily_logs (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date           date        NOT NULL,                              -- SEM DEFAULT
  pain_level     smallint    NOT NULL CHECK (pain_level BETWEEN 0 AND 10),
  fatigue_level  smallint    NOT NULL CHECK (fatigue_level BETWEEN 0 AND 10),
  sleep_quality  smallint    NOT NULL CHECK (sleep_quality BETWEEN 0 AND 10),
  mood_level     smallint    NOT NULL CHECK (mood_level BETWEEN 0 AND 10),
  anxiety_level  smallint    NOT NULL CHECK (anxiety_level BETWEEN 0 AND 10),
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),               -- NOVO
  UNIQUE (user_id, date)
);
```

Mudanças vs. migration 001:
- `DEFAULT CURRENT_DATE` removido de `date`
- `+ updated_at timestamptz NOT NULL DEFAULT now()`

---

#### `medications`

```sql
CREATE TABLE IF NOT EXISTS public.medications (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text        NOT NULL,
  dosage     text,
  frequency  text,                                                 -- era "schedule"
  start_date date,                                                 -- NOVO
  active     boolean     NOT NULL DEFAULT true,                    -- NOVO
  notes      text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()                    -- NOVO
);
```

Mudanças vs. migration 001:
- `schedule` → `frequency`
- `+ start_date date`
- `+ active boolean NOT NULL DEFAULT true`
- `+ updated_at timestamptz NOT NULL DEFAULT now()`

---

#### `reminders` *(criar na Fase 6A)*

```sql
CREATE TABLE IF NOT EXISTS public.reminders (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medication_id   uuid        NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  reminder_time   time        NOT NULL,
  timezone        text        NOT NULL,
  recurrence      text        NOT NULL DEFAULT 'daily',
  active          boolean     NOT NULL DEFAULT true,
  last_sent_at    timestamptz,
  next_trigger_at timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
```

---

#### `notification_preferences` *(criar na Fase 6A)*

```sql
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id               uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  push_enabled          boolean     NOT NULL DEFAULT false,
  email_enabled         boolean     NOT NULL DEFAULT false,
  daily_reminder_enabled boolean    NOT NULL DEFAULT false,
  daily_reminder_time   time,
  push_token            text,
  updated_at            timestamptz NOT NULL DEFAULT now()
);
```

---

### Índices alvo

```sql
-- daily_logs
CREATE INDEX IF NOT EXISTS daily_logs_user_date_idx
  ON public.daily_logs (user_id, date DESC);

-- medications — substitui medications_user_idx
CREATE INDEX IF NOT EXISTS medications_user_active_idx
  ON public.medications (user_id, active DESC, created_at DESC);

-- reminders (Fase 6A)
CREATE INDEX IF NOT EXISTS reminders_next_trigger_idx
  ON public.reminders (next_trigger_at)
  WHERE active = true;

CREATE INDEX IF NOT EXISTS reminders_medication_idx
  ON public.reminders (medication_id);
```

---

### Triggers alvo

```sql
-- profiles (já existe na migration 001)
CREATE OR REPLACE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- daily_logs (NOVO)
CREATE OR REPLACE TRIGGER daily_logs_updated_at
  BEFORE UPDATE ON public.daily_logs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- medications (NOVO)
CREATE OR REPLACE TRIGGER medications_updated_at
  BEFORE UPDATE ON public.medications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- reminders (Fase 6A)
CREATE OR REPLACE TRIGGER reminders_updated_at
  BEFORE UPDATE ON public.reminders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

A função `handle_updated_at()` já existe — apenas criar os triggers faltantes.

---

### RLS policies alvo

**Remover:**
```sql
DROP POLICY IF EXISTS "daily_logs_delete_own" ON public.daily_logs;
```

**Adicionar (Fase 6A):**
```sql
-- reminders: CRUD completo pelo owner
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reminders_select_own" ON public.reminders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "reminders_insert_own" ON public.reminders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reminders_update_own" ON public.reminders FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reminders_delete_own" ON public.reminders FOR DELETE USING (auth.uid() = user_id);

-- notification_preferences: SELECT + UPDATE apenas (INSERT via trigger ou setup inicial)
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_prefs_select_own" ON public.notification_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notif_prefs_update_own" ON public.notification_preferences FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notif_prefs_insert_own" ON public.notification_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
```

---

### `database.ts` alvo

```typescript
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          age: number | null;
          diagnosis: string | null;
          timezone: string;          // NOVO
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          age?: number | null;
          diagnosis?: string | null;
          timezone?: string;         // NOVO, tem default
        };
        Update: {
          name?: string;
          age?: number | null;
          diagnosis?: string | null;
          timezone?: string;         // NOVO
        };
      };
      daily_logs: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          pain_level: number;
          fatigue_level: number;
          sleep_quality: number;
          mood_level: number;
          anxiety_level: number;
          notes: string | null;
          created_at: string;
          updated_at: string;        // NOVO
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;              // SEM default — cliente sempre envia
          pain_level: number;
          fatigue_level: number;
          sleep_quality: number;
          mood_level: number;
          anxiety_level: number;
          notes?: string | null;
        };
        Update: {
          pain_level?: number;
          fatigue_level?: number;
          sleep_quality?: number;
          mood_level?: number;
          anxiety_level?: number;
          notes?: string | null;
        };
      };
      medications: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          dosage: string | null;
          frequency: string | null;
          start_date: string | null;
          active: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;        // NOVO
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          dosage?: string | null;
          frequency?: string | null;
          start_date?: string | null;
          active?: boolean;
          notes?: string | null;
        };
        Update: {
          name?: string;
          dosage?: string | null;
          frequency?: string | null;
          start_date?: string | null;
          active?: boolean;
          notes?: string | null;
        };
      };
    };
  };
};
```

---

## 4. SCHEMA STANDARDS

Padrões oficiais para toda migration e código TypeScript futuro do VivaLeve.

---

### IDs

```
tipo:    uuid
geração: gen_random_uuid() (servidor)
naming:  {tabela}_id nas FKs, apenas "id" na própria tabela
```

Nunca usar `bigint GENERATED ALWAYS AS IDENTITY` — UUIDs são geráveis offline, não expõem contagem de registros, e são compatíveis com multi-device sync futuro.

---

### Timestamps

```
tipo:    timestamptz (sempre, nunca timestamp sem timezone)
geração: now() via DEFAULT ou trigger
naming:  sufixo _at obrigatório
valores: sempre UTC no banco; conversão para local no cliente
```

| Campo | Quando usar |
|---|---|
| `created_at` | Toda tabela com dados de usuário |
| `updated_at` | Toda tabela que admite UPDATE |
| `deleted_at` | Tabelas com soft delete |
| `last_sent_at` | Tabelas de notificação/job |
| `next_trigger_at` | Tabelas de scheduling |

---

### Foreign Keys

```
naming:  {tabela_referenciada_singular}_id
tipo:    uuid NOT NULL
cascade: ON DELETE CASCADE para dados owned pelo usuário
         ON DELETE SET NULL para referências opcionais
         ON DELETE RESTRICT quando deleção deve ser prevenida
```

**Regra:** toda FK para `auth.users` usa `ON DELETE CASCADE`. Dados do usuário não têm valor sem o usuário.

---

### Booleans

```
naming:  sem prefixo is_ — usar nome descritivo: active, archived, verified
default: sempre explícito (DEFAULT true ou DEFAULT false)
```

---

### Datas vs. Timestamps

```
date:        para datas no timezone do usuário (log do dia, data de início)
timestamptz: para eventos de sistema (created_at, last_sent_at)
time:        para horários de configuração sem contexto de dia (reminder_time)
```

**Regra crítica:** `date` nunca tem `DEFAULT CURRENT_DATE`. Data de dia é sempre enviada pelo cliente.

---

### Strings e Texto

```
text:    para campos de conteúdo livre (notas, nome, dosagem)
varchar: evitar — text é equivalente em PostgreSQL e mais simples
```

Limites de tamanho (120 chars para nome, 1000 para notas, etc.) são enforced pelo Zod schema, não pelo banco. Exceção: se um campo for chave em index ou tiver constraint de unicidade, limitar o tamanho no banco previne problemas de index bloat.

---

### Níveis / Escalas numéricas

```
tipo:       smallint (2 bytes vs 4 do integer)
constraint: CHECK (coluna BETWEEN 0 AND 10)
frontend:   slider com min=0, max=10, step=1
```

---

### Índices

```
naming:   {tabela}_{colunas}_idx
tipo:     B-tree (padrão) para = e ORDER BY
          GIN para JSONB e full-text search
parcial:  WHERE cláusula para filtros recorrentes (ex: WHERE active = true)
composto: sempre na ordem (filter_cols, sort_cols) para cobrir sort sem heap
```

**Regra de thumb:** Se uma query tem `WHERE a = $1 ORDER BY b DESC`, o índice deve ser `ON (a, b DESC)`.

---

### Nomenclatura de Tabelas

```
singular:  não — plural é mais legível em SQL
plural:    sim — daily_logs, medications, profiles, reminders
snake_case: obrigatório
```

---

### Nomenclatura de Policies

```
formato: "{tabela}_{operação}_own"
ops:     select, insert, update, delete
```

---

### Nomenclatura de Triggers e Funções

```
triggers:  {tabela}_{evento}  →  profiles_updated_at, daily_logs_updated_at
funções:   handle_{contexto}  →  handle_updated_at, handle_new_user
```

---

### Soft Delete

Quando implementar:
- Tabelas onde deleção acidental é catastrófica (dados médicos/wellness)
- Tabelas referenciadas por outras (medications → reminders)

Padrão:
```sql
deleted_at timestamptz NULL  -- NULL = ativo, NOT NULL = deletado
```

Índice parcial obrigatório em toda query de listagem:
```sql
CREATE INDEX {tabela}_active_idx ON {tabela} (user_id, created_at DESC)
  WHERE deleted_at IS NULL;
```

Todas as queries de listagem adicionam `WHERE deleted_at IS NULL`. RLS policies também devem incluir esta condição quando soft delete estiver ativo.

---

### Enums

```
PostgreSQL enum: usar para valores fixos e fechados (ex: recurrence: daily, weekly, custom)
text:            usar para valores open-ended (ex: frequency, diagnosis)
```

Enums PostgreSQL são difíceis de modificar (`ALTER TYPE ADD VALUE` não é transacional em algumas versões). Para valores que podem crescer, preferir `text` com CHECK constraint.

---

### Auditoria e Rastreabilidade

Toda tabela com dados owned pelo usuário deve ter:
```sql
created_at timestamptz NOT NULL DEFAULT now()
updated_at timestamptz NOT NULL DEFAULT now()
```

E o trigger correspondente usando `handle_updated_at()`.

---

### TypeScript: Shared Types

Tipos de UI que aparecem em múltiplas features devem residir em `src/types/ui.ts`, não em cada feature individualmente.

```typescript
// src/types/ui.ts
export type AsyncStatus = "idle" | "pending" | "success" | "error";
export type DeletePhase = "idle" | "confirming" | "deleting" | "error";
```

Features podem aliasear localmente se necessário:
```typescript
// src/features/daily-log/types.ts
import type { AsyncStatus } from "@/types/ui";
export type SaveStatus = AsyncStatus;
```

---

## 5. FINAL ARCHITECTURE VERDICT

### O que está correto e sólido

**Segurança:** A arquitetura de segurança está bem construída. Server Actions como único boundary de escrita, RLS como segunda camada, `getUser()` server-side, `user_id` nunca vindo do cliente — estes são os padrões corretos para Supabase. Não há vulnerabilidade estrutural aqui.

**Separação de responsabilidades:** Features isoladas, Server Actions separados por domínio, Zod como contrato de entrada, `database.ts` como source of truth dos tipos — a estrutura de código é limpa e escalável.

**Timezone para daily logs:** A decisão de enviar `date` pelo cliente é tecnicamente correta e crítica para o público brasileiro. Está implementada corretamente nas Server Actions.

**Upsert strategy para daily logs:** `UNIQUE(user_id, date)` + `onConflict` é a abordagem certa para garantir exatamente um registro por dia sem race conditions.

**Cascade behavior:** Todas as FKs para `auth.users` usam `ON DELETE CASCADE` corretamente. Deleção de usuário limpa dados automaticamente.

---

### Riscos futuros

**Extensibilidade de sintomas:** Os 5 campos de sintoma (`pain_level`, `fatigue_level`, etc.) estão hardcoded. Adicionar "brain fog" ou "stress" requer `ALTER TABLE ADD COLUMN` + nova migration + atualização de `database.ts` + formulário. Isso não é um problema agora, mas deve ser planejado. Para este domínio (wellness crônico), 5–8 dimensões fixas é arquiteturalmente saudável — JSONB seria over-engineering.

**Pagination do histórico:** `LIMIT 30` sem cursor pagination é funcional para o MVP mas cria um teto artificial de dados acessíveis. Usuários que usarem o app por 1 ano terão ~365 registros e verão apenas os últimos 30. Implementar cursor pagination (baseado em `date`) é a próxima melhoria de UX com impacto em escalabilidade.

**Crescimento de dados:** Com 10k usuários ativos gerando 1 log/dia, `daily_logs` acumula ~3.65M rows/ano. O índice `(user_id, date DESC)` mantém queries eficientes por usuário independente do volume total — não é necessário particionamento. Revisitar em 50M+ rows.

**Reminders:** A arquitetura de reminders é a maior complexidade futura. Requer: timezone persistido, cron job (pg_cron ou Supabase Cron), Edge Function para cálculo de `next_trigger_at`, e push notification infrastructure. O campo `profiles.timezone` que precisa ser adicionado agora é o pré-requisito mais crítico.

---

### Gargalos identificados

| Gargalo | Quando se torna problema | Solução preventiva |
|---|---|---|
| `SELECT *` no histórico | > 1000 usuários ativos | Selecionar colunas explicitamente |
| `LIMIT 30` no histórico | Usuários com > 30 registros | Cursor pagination |
| Sem soft delete em medications | Primeiro usuário que deletar acidentalmente | `deleted_at` antes de lançar |
| Sem `updated_at` em logs | Qualquer analytics ou debug | Adicionar agora (pre-launch) |

---

### Nota arquitetural

| Dimensão | Nota | Justificativa |
|---|---|---|
| Segurança (RLS + Actions) | 9/10 | Sólida; apenas a policy DELETE desnecessária em daily_logs |
| Consistência schema/código | 4/10 | Migration 001 está severamente desatualizada |
| Modelagem relacional | 7/10 | Correta para o domínio; perde ponto por ausência de `updated_at` e `timezone` |
| Escalabilidade | 7/10 | Índices adequados para MVP; cursor pagination é o próximo passo |
| Future-proofing | 6/10 | Boa base; timezone e soft delete devem ser adicionados antes do launch |
| TypeScript alignment | 7/10 | `database.ts` correto para o alvo; duplicação de `SaveStatus` é dívida menor |
| **GERAL** | **7/10** | Base sólida com 1 problema crítico de fácil correção antes do launch |

---

### Veredito

A fundação arquitetural do VivaLeve é sólida. As decisões de segurança, separação de responsabilidades, e modelagem de dados para o domínio estão corretas. O problema crítico (migration desatualizada) é de fácil resolução — requer apenas um arquivo SQL — e deve ser corrigido antes de qualquer deploy. Os problemas de médio prazo (`updated_at`, `timezone`, soft delete) são predizíveis e seguem um padrão de maturação natural de produto. Com a migration 002 aplicada, o banco estará pronto para suportar o crescimento planejado do produto até V2.

**Ação imediata requerida:** Criar `supabase/migrations/002_schema_corrections.sql` com as correções documentadas na Seção 2 deste relatório antes de conectar o app a qualquer banco Supabase real.
