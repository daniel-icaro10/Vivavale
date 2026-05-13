# DATABASE STANDARDS — VivaLeve
> **Status:** Oficial. Fonte de verdade para todos os schemas e migrations.
> **Última revisão:** 2026-05-13
> **Escopo:** PostgreSQL via Supabase, todas as tabelas públicas.

---

## 1. Naming Conventions

### Tabelas

```
snake_case, plural, sem prefixo
```

| Correto | Incorreto |
|---|---|
| `daily_logs` | `DailyLog`, `dailyLog`, `tbl_daily_logs` |
| `medications` | `Medication`, `medication`, `med` |
| `notification_preferences` | `NotifPrefs`, `user_notifications` |

### Colunas

```
snake_case, singular
```

| Correto | Incorreto |
|---|---|
| `user_id` | `userId`, `user`, `uid` |
| `pain_level` | `painLevel`, `pain` |
| `medication_id` | `med_id`, `medicationId` |
| `time_local` | `timeLocal`, `local_time` |

### Foreign Keys

```
{tabela_referenciada_singular}_id
```

| Relação | Nome da coluna |
|---|---|
| → `auth.users` | `user_id` |
| → `medications` | `medication_id` |

**Nunca abreviar:** `medication_id`, não `med_id`. `user_id`, não `uid`.

### Timestamps

```
sufixo _at para timestamptz
sem sufixo para tipo date (sem hora)
```

| Campo | Tipo | Exemplo |
|---|---|---|
| `created_at` | `timestamptz` | criação do registro |
| `updated_at` | `timestamptz` | última modificação |
| `last_sent_at` | `timestamptz` | último envio |
| `next_trigger_at` | `timestamptz` | próximo disparo UTC |
| `date` | `date` | data do daily log |
| `start_date` | `date` | data de início do medicamento |

### Booleans

```
substantivo ou adjetivo descritivo, sem prefixo is_ ou has_
sem negação no nome
```

| Correto | Incorreto |
|---|---|
| `active` | `is_active`, `isActive`, `disabled` |
| `reminders_enabled` | `has_reminders`, `notifications_off` |

### Índices

```
{tabela}_{colunas}_idx
```

| Exemplo | Uso |
|---|---|
| `daily_logs_user_date_idx` | `(user_id, date DESC)` |
| `medications_user_active_idx` | `(user_id, active DESC, created_at DESC)` |
| `reminders_next_trigger_idx` | `(next_trigger_at) WHERE active = true` |

### Policies RLS

```
"{tabela}_{operação}_own"
```

| Exemplo |
|---|
| `"daily_logs_select_own"` |
| `"medications_delete_own"` |
| `"reminders_update_own"` |

### Triggers

```
{tabela}_{evento}
```

| Exemplo |
|---|
| `profiles_updated_at` |
| `medications_updated_at` |
| `reminders_updated_at` |
| `on_auth_user_created` |

### Funções

```
handle_{contexto}
```

| Exemplo |
|---|
| `handle_updated_at` |
| `handle_new_user` |

---

## 2. Tipos de Dados

### IDs

- Todos os IDs primários usam `uuid`
- Geração: `gen_random_uuid()` (PostgreSQL 13+, nativo no Supabase)
- Exceção: `profiles.id` espelha `auth.users.id` — não usa `DEFAULT gen_random_uuid()`

```sql
-- CORRETO
id uuid PRIMARY KEY DEFAULT gen_random_uuid()

-- CORRETO — profiles (espelha auth.users)
id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE

-- INCORRETO
id serial PRIMARY KEY
id integer PRIMARY KEY
id bigint GENERATED ALWAYS AS IDENTITY
```

### Strings

- Tipo `text` para todas as strings sem limite de comprimento no banco
- Limites de caracteres são responsabilidade do Zod schema no frontend
- Nunca usar `varchar(n)` — não há vantagem de performance em PostgreSQL

```sql
-- CORRETO
name text NOT NULL
notes text

-- INCORRETO
name varchar(120) NOT NULL
notes character varying(1000)
```

### Números inteiros em escalas pequenas

- `smallint` para escalas de 0–10 (ocupa 2 bytes vs 4 do `integer`)
- `integer` para contagens e valores que podem crescer

```sql
-- CORRETO — escalas de sintoma
pain_level smallint NOT NULL CHECK (pain_level BETWEEN 0 AND 10)

-- CORRETO — contagens gerais
error_count integer NOT NULL DEFAULT 0
```

### Timestamps

- Sempre `timestamptz` (timestamp with time zone)
- Armazenados em UTC pelo PostgreSQL
- Retornados como ISO 8601 UTC pelo Supabase client
- Nunca `timestamp` sem timezone

```sql
-- CORRETO
created_at timestamptz NOT NULL DEFAULT now()
next_trigger_at timestamptz

-- INCORRETO
created_at timestamp NOT NULL DEFAULT now()
next_trigger_at timestamp with local time zone
```

### Tipo time

- `time` (without time zone) para horários locais do usuário
- Armazenado como `HH:MM:SS`, retornado como string pelo Supabase client
- Sempre normalizar para `HH:MM` na aplicação antes de usar

```sql
-- CORRETO — horário local do lembrete
time_local time NOT NULL

-- CORRETO — quiet hours
quiet_hours_start time
quiet_hours_end time
```

### Datas

- Tipo `date` para campos que representam uma data no calendário local do usuário
- Sem `DEFAULT CURRENT_DATE` — o banco usa UTC; o cliente envia a data local
- Sempre receber a data como parâmetro explícito da aplicação

```sql
-- CORRETO
date date NOT NULL
start_date date

-- INCORRETO — usa data UTC do servidor, não data local do usuário
date date NOT NULL DEFAULT CURRENT_DATE
```

### Enums

- PostgreSQL custom enum types não são usados no projeto
- Enums são implementados como `text NOT NULL CHECK (col IN (...))` para flexibilidade
- Valores reservados para expansão futura usam sufixo `_future` no nome

```sql
-- CORRETO
recurrence text NOT NULL DEFAULT 'daily'
  CHECK (recurrence IN ('daily', 'weekdays', 'custom_future'))

-- INCORRETO
CREATE TYPE recurrence_type AS ENUM ('daily', 'weekdays');
recurrence recurrence_type NOT NULL
```

**Razão:** ALTER TYPE ADD VALUE não pode ser feito dentro de uma transação em PostgreSQL. `CHECK` constraints com `IN` são facilmente extensíveis via migration sem restrições transacionais.

---

## 3. Estratégia de IDs e PKs

| Tabela | PK | Geração |
|---|---|---|
| `profiles` | `id uuid` | Espelha `auth.users.id` |
| `daily_logs` | `id uuid` | `gen_random_uuid()` |
| `medications` | `id uuid` | `gen_random_uuid()` |
| `reminders` | `id uuid` | `gen_random_uuid()` |
| `notification_preferences` | `user_id uuid` | FK direto (tabela 1:1) |

**Regra:** Tabelas 1:1 com `auth.users` usam `user_id` como PK e FK simultâneos. Todas as outras tabelas têm `id uuid` próprio.

---

## 4. Estratégia de updated_at

Todo registro editável tem `updated_at timestamptz NOT NULL DEFAULT now()`.

**Atualização:** exclusivamente via trigger `BEFORE UPDATE FOR EACH ROW`, que chama `public.handle_updated_at()`.

```sql
-- Função compartilhada (criada em migration 001)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger por tabela (CREATE OR REPLACE = idempotente)
CREATE OR REPLACE TRIGGER {tabela}_updated_at
  BEFORE UPDATE ON public.{tabela}
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

**Regras:**
- A aplicação nunca define `updated_at` manualmente em INSERT ou UPDATE
- O campo não aparece nos tipos `Insert` nem `Update` do TypeScript
- Aparece no tipo `Row` como `string` (ISO 8601 UTC)

**Exceção:** `notification_preferences` — tabela 1:1 criada lazily via upsert; `updated_at` tem `DEFAULT now()` e é atualizado pelo trigger normal.

---

## 5. Foreign Keys e CASCADE

**Regra universal:** todas as FKs que referenciam `auth.users(id)` usam `ON DELETE CASCADE`.

**Razão:** Dados são exclusivamente privados do usuário. Não há valor semântico em manter dados após a exclusão do usuário. Sem `ON DELETE CASCADE`, a exclusão de usuário pelo Supabase Auth falharia com FK constraint error.

| Relação | ON DELETE | Razão |
|---|---|---|
| `profiles → auth.users` | CASCADE | 1:1, sem sentido sem o usuário |
| `daily_logs → auth.users` | CASCADE | Dados privados |
| `medications → auth.users` | CASCADE | Dados privados |
| `reminders → auth.users` | CASCADE | Dados privados |
| `reminders → medications` | CASCADE | Lembrete sem medicamento é sem sentido |
| `notification_preferences → auth.users` | CASCADE | 1:1, dados privados |

**Não existe `SET NULL` neste schema.** Não existe `RESTRICT` explícito (é o default do PostgreSQL, mas CASCADE é o comportamento correto aqui).

---

## 6. Índices

### Princípios

1. Criar índice para toda coluna `user_id` + critério de ordenação da query principal
2. Criar índice para toda FK que não seja PK (PostgreSQL não cria automaticamente)
3. Usar índices parciais (`WHERE condition`) quando a query tem filtro fixo
4. Não indexar colunas usadas apenas em busca textual (sem full-text no MVP)
5. Não criar índice em `created_at` isolado — sempre junto com `user_id`

### Índices atuais

| Índice | Tabela | Definição | Justificativa |
|---|---|---|---|
| `daily_logs_user_date_idx` | `daily_logs` | `(user_id, date DESC)` | Lista histórico + lookup do dia |
| `medications_user_active_idx` | `medications` | `(user_id, active DESC, created_at DESC)` | Ordenação padrão da lista |
| `reminders_next_trigger_idx` | `reminders` | `(next_trigger_at) WHERE active = true` | Cron job / Edge Function futuro |
| `reminders_user_time_idx` | `reminders` | `(user_id, time_local)` | Listagem por horário |
| `reminders_medication_idx` | `reminders` | `(medication_id)` | FK cascade + queries por medicamento |

### O que NÃO indexar

- `profiles`: lookup sempre por PK. Sem índice adicional.
- Campos de texto livre (`name`, `notes`, `diagnosis`): sem busca textual no MVP.
- `created_at` isolado: sempre coberto pelo índice composto com `user_id`.
- Colunas booleanas sozinhas: baixa cardinalidade, índice ineficiente.

---

## 7. Constraints

### CHECK Constraints

```sql
-- Escala de sintoma
CHECK (pain_level BETWEEN 0 AND 10)

-- Enum via texto
CHECK (recurrence IN ('daily', 'weekdays', 'custom_future'))

-- Idade do usuário
CHECK (age > 0 AND age < 120)
```

### UNIQUE Constraints

```sql
-- Um daily_log por usuário por dia
UNIQUE (user_id, date)
```

### NOT NULL Policy

- Campos obrigatórios: `NOT NULL`
- Campos opcionais: sem `NOT NULL`, sem `DEFAULT`, aceitar `NULL`
- Campos com valor padrão sensato: `NOT NULL DEFAULT valor`

```sql
-- CORRETO — obrigatório sem default
name text NOT NULL

-- CORRETO — opcional
notes text

-- CORRETO — obrigatório com default sensato
active boolean NOT NULL DEFAULT true
timezone text NOT NULL DEFAULT 'America/Sao_Paulo'
```

---

## 8. Soft Delete

**Política atual: hard delete em todas as tabelas.**

`active boolean` em `medications` e `reminders` é **"soft inactive"** — o registro permanece no banco mas é marcado como não ativo. Não é soft delete: sem `deleted_at`, sem `deleted_by`, sem possibilidade de restore via UI.

**Razão:** soft delete real adiciona complexidade às queries (todo SELECT precisa de `WHERE deleted_at IS NULL`), às policies RLS e ao TypeScript. O benefício (auditoria de deletes) não justifica o custo para o MVP.

**Futuramente:** se auditoria for necessária, adicionar `deleted_at timestamptz` e atualizar todas as policies e queries. Documentar como migration aditiva.

---

## 9. Campos de Auditoria

Todo registro que o usuário pode criar ou editar tem:

| Campo | Tipo | Preenchido por |
|---|---|---|
| `created_at` | `timestamptz NOT NULL DEFAULT now()` | Banco (automático) |
| `updated_at` | `timestamptz NOT NULL DEFAULT now()` | Trigger (automático) |

Exceções:
- `notification_preferences`: tem `created_at` e `updated_at` ✓
- `profiles`: tem `created_at` e `updated_at` ✓
- `daily_logs`: tem `created_at` e `updated_at` ✓

`user_id` é campo de controle de propriedade, não de auditoria. Não substituir por `created_by` ou `owner_id`.

---

## 10. Proibições Absolutas

```sql
-- ❌ PROIBIDO: serial/sequence IDs
id serial PRIMARY KEY

-- ❌ PROIBIDO: DEFAULT CURRENT_DATE (usa data UTC do servidor)
date date NOT NULL DEFAULT CURRENT_DATE

-- ❌ PROIBIDO: timestamp sem timezone
created_at timestamp NOT NULL DEFAULT now()

-- ❌ PROIBIDO: varchar com limite (use text)
name varchar(120) NOT NULL

-- ❌ PROIBIDO: enum PostgreSQL customizado
CREATE TYPE status AS ENUM ('active', 'inactive')

-- ❌ PROIBIDO: FK sem CASCADE para auth.users
user_id uuid NOT NULL REFERENCES auth.users(id)

-- ❌ PROIBIDO: editar updated_at manualmente
UPDATE medications SET updated_at = now() WHERE ...

-- ❌ PROIBIDO: definir updated_at no INSERT da aplicação
supabase.from('medications').insert({ ..., updated_at: new Date() })
```
