# Database Architecture — VivaLeve

> **Status:** Blueprint oficial. Nenhuma migration deve ser escrita sem consultar este documento.
> **Última revisão:** 2026-05-13
> **Escopo:** PostgreSQL via Supabase, App Router, Server Actions, RLS.

---

## 1. Architectural Principles

### Owner-only data model
Todo dado de usuário carrega `user_id uuid NOT NULL REFERENCES auth.users(id)`. Não existe tabela compartilhada entre usuários no MVP. A consulta mais barata e segura é sempre `WHERE user_id = auth.uid()`.

### Mobile-first assumptions
O aplicativo roda majoritariamente em dispositivos móveis no Brasil. Usuários operam em UTC-3 (Brasília) e UTC-2 (horário de verão). Nenhuma lógica de "hoje" pode ser delegada ao servidor — o servidor opera em UTC e não conhece o timezone local do cliente no momento da requisição.

### Low cognitive load como restrição arquitetural
O público tem fadiga mental como sintoma central. O schema deve ser simples o suficiente para que qualquer operação de leitura relevante possa ser expressa em uma única query `SELECT` com filtros básicos. Sem JOINs complexos no caminho crítico.

### Timezone-safe architecture
Timestamps são sempre armazenados em UTC (`timestamptz`). Datas de registros diários usam `date` simples, enviada pelo cliente como string `YYYY-MM-DD` representando a data no timezone do usuário. Reminders futuros dependem de um campo `timezone` persistido no perfil.

### Server Actions como boundary de escrita
Todo `INSERT`, `UPDATE` e `DELETE` passa por Server Actions. O cliente nunca escreve diretamente no Supabase. A Server Action extrai `user_id` do servidor (`supabase.auth.getUser()`), nunca do corpo da requisição. RLS é a segunda linha de defesa — não a primeira.

### Defense in depth
Server Actions verificam `user_id` explicitamente. RLS verifica `auth.uid()` no banco. As duas camadas são independentes. Se uma falhar, a outra ainda protege os dados.

### Supabase como plataforma
Auth, banco, RLS e futuras Edge Functions vivem no mesmo projeto Supabase. Não há backend adicional. O cliente Next.js se comunica com o banco apenas via Server Actions (nunca diretamente do browser).

---

## 2. Naming Conventions

| Elemento | Convenção | Exemplo |
|---|---|---|
| Tabelas | `snake_case`, plural | `daily_logs`, `medications` |
| Colunas | `snake_case`, singular | `user_id`, `pain_level` |
| Timestamps | sufixo `_at` | `created_at`, `updated_at`, `last_sent_at` |
| Foreign keys | nome da tabela no singular + `_id` | `user_id`, `medication_id` |
| Booleans | prefixo descritivo, sem negação | `active` (não `is_active`, não `disabled`) |
| Datas (sem hora) | tipo `date`, sem sufixo | `date`, `start_date` |
| IDs | `uuid`, gerados com `gen_random_uuid()` | exceto `profiles.id` que espelha `auth.users.id` |
| Índices | `{tabela}_{colunas}_idx` | `daily_logs_user_date_idx` |
| Policies | `"{tabela}_{operação}_own"` | `"daily_logs_select_own"` |
| Triggers | `{tabela}_{evento}` | `profiles_updated_at` |
| Funções | `handle_{contexto}` | `handle_new_user`, `handle_updated_at` |

### Regras adicionais

- Nunca abreviar nomes de coluna para economizar caracteres (`medication_id`, não `med_id`).
- Campos opcionais são `NULL`-able e sem default. Campos obrigatórios são `NOT NULL`.
- `text` para strings sem limite de comprimento no banco; validação de tamanho é responsabilidade do Zod schema no frontend.
- `smallint` para escalas numéricas de 0–10 (ocupa 2 bytes vs 4 do `integer`).

---

## 3. Tables

### `profiles`

Armazena dados de perfil do usuário. Criado automaticamente via trigger `on_auth_user_created` quando um novo usuário se registra no Supabase Auth.

| Coluna | Tipo | Nullable | Default | Descrição |
|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | — | Espelha `auth.users.id`. PK e FK simultâneos. |
| `name` | `text` | NOT NULL | — | Nome do usuário. Extraído de `raw_user_meta_data` no trigger. |
| `age` | `integer` | NULL | — | Idade. Opcional. CHECK `> 0 AND < 120`. |
| `diagnosis` | `text` | NULL | — | Diagnóstico em texto livre. Opcional. |
| `timezone` | `text` | NULL | `'America/Sao_Paulo'` | Timezone IANA do usuário. Necessário para reminders. |
| `created_at` | `timestamptz` | NOT NULL | `now()` | UTC. |
| `updated_at` | `timestamptz` | NOT NULL | `now()` | UTC. Atualizado por trigger. |

**Constraints:**
- `PRIMARY KEY (id)`
- `FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE`
- `CHECK (age > 0 AND age < 120)`

**Índices:** Nenhum adicional além da PK. Lookup é sempre por `id` (PK).

**Relações:** 1:1 com `auth.users`. Um perfil por usuário.

**Observações:**
- `timezone` ainda não está na migration 001. Deve ser adicionado na migration 002 antes da Fase 6A (Reminders).
- INSERT é feito exclusivamente pelo trigger `handle_new_user` (SECURITY DEFINER). Não existe policy de INSERT para esta tabela.

---

### `daily_logs`

Registro diário de sintomas. Um log por usuário por dia.

| Coluna | Tipo | Nullable | Default | Descrição |
|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK. |
| `user_id` | `uuid` | NOT NULL | — | FK para `auth.users`. |
| `date` | `date` | NOT NULL | — | Data no timezone do cliente. Enviada como `YYYY-MM-DD`. Sem default de banco. |
| `pain_level` | `smallint` | NOT NULL | — | 0–10. CHECK. |
| `fatigue_level` | `smallint` | NOT NULL | — | 0–10. CHECK. |
| `sleep_quality` | `smallint` | NOT NULL | — | 0–10. CHECK. |
| `mood_level` | `smallint` | NOT NULL | — | 0–10. CHECK. |
| `anxiety_level` | `smallint` | NOT NULL | — | 0–10. CHECK. |
| `notes` | `text` | NULL | — | Observações livres. |
| `created_at` | `timestamptz` | NOT NULL | `now()` | UTC. Apenas para ordenação e auditoria. |

**Constraints:**
- `PRIMARY KEY (id)`
- `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE`
- `UNIQUE (user_id, date)` — garante no máximo um log por dia por usuário
- `CHECK (pain_level BETWEEN 0 AND 10)` — idêntico para todos os `*_level`

**Índices:**
- `daily_logs_user_date_idx ON (user_id, date DESC)` — suporta queries de histórico ordenado

**Relações:** N:1 com `auth.users`.

**Observações:**
- A constraint `UNIQUE (user_id, date)` é o coração desta tabela. O UPSERT da Server Action usa `onConflict: 'user_id,date'` para atualizar o registro existente ou criar um novo.
- `date` **não tem default de banco**. A migration 001 define `DEFAULT CURRENT_DATE` — isso está errado e deve ser removido na migration 002. Ver Seção 5 para explicação completa.

---

### `medications`

Lista de medicamentos do usuário. Suporta registros ativos e históricos.

| Coluna | Tipo | Nullable | Default | Descrição |
|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK. |
| `user_id` | `uuid` | NOT NULL | — | FK para `auth.users`. |
| `name` | `text` | NOT NULL | — | Nome do medicamento. |
| `dosage` | `text` | NULL | — | Dose em texto livre. Ex: "500mg". |
| `frequency` | `text` | NULL | — | Frequência em texto livre. Ex: "1 vez ao dia". |
| `start_date` | `date` | NULL | — | Data de início. Formato `YYYY-MM-DD`. |
| `active` | `boolean` | NOT NULL | `true` | Se o usuário ainda usa o medicamento. |
| `notes` | `text` | NULL | — | Observações livres. Máx 1000 chars no frontend. |
| `created_at` | `timestamptz` | NOT NULL | `now()` | UTC. |

**Constraints:**
- `PRIMARY KEY (id)`
- `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE`

**Índices:**
- `medications_user_active_idx ON (user_id, active, created_at DESC)` — suporta ordenação padrão da lista (ativos primeiro, depois por data)

**Relações:** N:1 com `auth.users`. 1:N futura com `reminders`.

**Observações:**
- A migration 001 tem coluna `schedule` em vez de `frequency`, e está faltando `active` e `start_date`. **Esta é uma divergência crítica** entre código e banco. Ver Seção 12 (Critical Review).
- `frequency` é texto livre intencionalmente no MVP. Normalizar para `recurrence` estruturado (RRULE ou enum) é trabalho de V2, quando reminders forem implementados.

---

### `reminders` *(planejamento futuro — não implementar agora)*

Configuração de lembretes vinculados a medicamentos.

| Coluna | Tipo | Nullable | Default | Descrição |
|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK. |
| `user_id` | `uuid` | NOT NULL | — | FK para `auth.users`. Redundante mas útil para RLS. |
| `medication_id` | `uuid` | NOT NULL | — | FK para `medications`. |
| `reminder_time` | `time` | NOT NULL | — | Horário local do lembrete. Ex: `08:00`. |
| `timezone` | `text` | NOT NULL | — | Timezone IANA snapshot do momento da criação. |
| `recurrence` | `text` | NOT NULL | `'daily'` | Frequência: `daily`, `weekly`, `custom`. |
| `active` | `boolean` | NOT NULL | `true` | Se o lembrete está ativo. |
| `last_sent_at` | `timestamptz` | NULL | — | UTC do último envio. |
| `next_trigger_at` | `timestamptz` | NULL | — | UTC calculado do próximo disparo. |
| `created_at` | `timestamptz` | NOT NULL | `now()` | UTC. |

**Índices planejados:**
- `reminders_next_trigger_idx ON (next_trigger_at) WHERE active = true` — suporta job de background que busca reminders pendentes

**Observações:** Ver Seção 7 para estratégia completa de reminders.

---

### `notification_preferences` *(planejamento futuro — não implementar agora)*

Configurações de notificação por canal do usuário.

| Coluna | Tipo | Nullable | Default | Descrição |
|---|---|---|---|---|
| `user_id` | `uuid` | NOT NULL | — | PK e FK para `auth.users`. |
| `push_enabled` | `boolean` | NOT NULL | `false` | Notificações push habilitadas. |
| `email_enabled` | `boolean` | NOT NULL | `false` | Notificações por e-mail habilitadas. |
| `daily_reminder_enabled` | `boolean` | NOT NULL | `false` | Lembrete de registro diário. |
| `daily_reminder_time` | `time` | NULL | — | Horário do lembrete diário (local). |
| `push_token` | `text` | NULL | — | Token de dispositivo para push notifications. |
| `updated_at` | `timestamptz` | NOT NULL | `now()` | UTC. |

---

## 4. Relationship Strategy

```
auth.users (Supabase Auth)
  │
  ├── 1:1  profiles           (ON DELETE CASCADE)
  │
  ├── 1:N  daily_logs         (ON DELETE CASCADE)
  │
  ├── 1:N  medications        (ON DELETE CASCADE)
  │         │
  │         └── 1:N  reminders        (ON DELETE CASCADE)
  │
  └── 1:1  notification_preferences  (ON DELETE CASCADE)
```

### Cascade behavior

| Relação | ON DELETE | Rationale |
|---|---|---|
| `auth.users → profiles` | `CASCADE` | Perfil não existe sem usuário |
| `auth.users → daily_logs` | `CASCADE` | Dados privados do usuário, sem valor sem ele |
| `auth.users → medications` | `CASCADE` | Idem |
| `auth.users → notification_preferences` | `CASCADE` | Idem |
| `medications → reminders` | `CASCADE` | Lembrete não faz sentido sem o medicamento |

**Não existe `SET NULL` neste schema.** Todas as FK que apontam para `auth.users` usam CASCADE porque os dados são exclusivamente do usuário e não têm utilidade standalone.

### Delete strategy

Quando um usuário é deletado do Supabase Auth, o CASCADE garante limpeza automática de todas as tabelas filhas. Não há necessidade de lógica de deleção em cascata no código da aplicação.

Quando um medicamento é deletado, os reminders associados também são removidos via CASCADE. A Server Action de deleção de medication não precisa limpar reminders manualmente.

---

## 5. Daily Logs Strategy

### Um log por dia por usuário

A constraint `UNIQUE (user_id, date)` é enforced no banco. O comportamento esperado é UPSERT: se já existe um log para aquela data, atualiza; caso contrário, cria. A Server Action usa:

```
.upsert({ user_id, date, ...fields }, { onConflict: 'user_id,date' })
```

### Por que `date` é enviado pelo cliente

O campo `date` representa a data **no timezone do usuário**, não a data UTC do servidor.

**Cenário problemático:** Usuário em São Paulo (UTC-3) registra seus sintomas às 23:30 do dia 15. No servidor (UTC), já são 02:30 do dia 16. Se o banco usasse `DEFAULT CURRENT_DATE`, o registro seria datado em 16 — um dia errado.

Por isso:
- `date` **não tem default no banco**
- O cliente calcula e envia a string `YYYY-MM-DD` representando "hoje" no seu timezone
- No código: `new Date().toLocaleDateString('en-CA')` ou equivalente que produz `YYYY-MM-DD`
- O servidor aceita e persiste sem modificação

### Por que o servidor não filtra "hoje"

O endpoint de Daily Log não recebe `?date=today`. A Server Action que busca o log do dia recebe a data como parâmetro enviado pelo cliente ou não aplica filtro de "hoje" — apenas autentica o usuário e devolve os dados ordenados.

Filtrar por "hoje" no servidor exigiria conhecer o timezone do cliente em tempo real. Mesmo que o `profiles.timezone` esteja salvo, o usuário pode ter viajado ou alterado o timezone do dispositivo. A fonte de verdade de "hoje" é sempre o dispositivo do usuário.

### Níveis de sintoma

Escala `smallint` de 0 a 10 inclusive. `CHECK (X BETWEEN 0 AND 10)` é enforced para cada campo. No frontend, os sliders têm `min=0`, `max=10`, `step=1`. Valor padrão do formulário é `5` (centro da escala).

---

## 6. Medications Strategy

### Active vs. histórico

`active = true` significa "o usuário ainda usa este medicamento hoje". `active = false` é registro histórico — o usuário tomou mas não toma mais. Ambos são exibidos na lista, com `active = false` em opacidade reduzida.

A ordenação padrão é `.order("active", ascending: false).order("created_at", ascending: false)`: ativos primeiro, depois por data de criação decrescente dentro de cada grupo.

### Frequência como texto livre (MVP intencional)

`frequency` armazena strings como "1 vez ao dia", "de 8 em 8 horas", "quando necessário". Não é normalizado para enum ou RRULE no MVP porque:

1. A variedade de regimes de fibromialgia é alta e imprevisível
2. Não há trigger de notificação nesta fase
3. Forçar enums cria atrito de entrada sem benefício funcional ainda

Quando reminders forem implementados, haverá um campo `recurrence` estruturado na tabela `reminders`. O `frequency` de `medications` permanece como descrição humana.

### Start date

`start_date date NULL` é opcional. Quando presente, o card exibe "Desde mai. de 2024". Não há lógica de cálculo de duração — apenas exibição descritiva.

### Notes

Texto livre, limite de 1000 caracteres enforced pelo Zod schema no frontend (não no banco). O banco aceita qualquer `text`. Line-clamp no card limita a 2 linhas visuais.

---

## 7. Reminder Architecture *(Fase 6A — não implementar agora)*

Esta seção documenta a estratégia futura para não criar decisões de schema incompatíveis hoje.

### Princípio central

Reminders devem disparar no horário **local do usuário**. Um lembrete configurado para "08:00" deve chegar às 08:00 hora de Brasília, não às 08:00 UTC (que seria 05:00 no Brasil).

### Timezone persistido

`profiles.timezone` armazena o timezone IANA (`America/Sao_Paulo`, `America/Manaus`, etc.) do usuário. Este campo é definido na configuração inicial ou no primeiro uso da feature de reminders.

Cada `reminder` também persiste um campo `timezone` como snapshot do timezone no momento da criação. Isso é necessário porque o usuário pode mudar de timezone depois, e o reminder deve continuar disparando no timezone original ou ser re-configurado explicitamente.

### Cálculo de `next_trigger_at`

Quando um reminder é criado ou atualizado, uma Edge Function calcula `next_trigger_at` em UTC:

```
next_trigger_at = next_occurrence_of(reminder_time, timezone)
```

Por exemplo: `reminder_time = '08:00'`, `timezone = 'America/Sao_Paulo'` em horário padrão (UTC-3) resulta em `next_trigger_at = 11:00 UTC`.

### DST (Daylight Saving Time)

O Brasil encerrou o horário de verão em 2019, mas a arquitetura deve ser DST-safe por suportar outros fusos. A biblioteca `date-fns-tz` ou equivalente deve ser usada no cálculo de `next_trigger_at`, nunca offset manual (`UTC-3` hardcoded).

### Job de background

Um cron job (Supabase Edge Function com pg_cron ou Supabase Cron) executa periodicamente:

```sql
SELECT * FROM reminders
WHERE active = true
  AND next_trigger_at <= now()
```

Para cada reminder encontrado:
1. Envia a notificação
2. Atualiza `last_sent_at = now()`
3. Calcula e persiste o novo `next_trigger_at`

O índice `reminders_next_trigger_idx ON (next_trigger_at) WHERE active = true` torna este scan eficiente mesmo com muitos reminders.

### Travel / mudança de dispositivo

Se o usuário viaja para outro fuso, o `profiles.timezone` pode ser atualizado. Reminders existentes continuam no timezone original até que o usuário os re-configure. Esta é uma decisão de UX intencional — não atualizar silenciosamente o timezone de todos os reminders.

---

## 8. Timezone Strategy

Esta é a seção mais crítica para evitar bugs silenciosos em produção.

### Regra fundamental

> **Timestamps são UTC. Datas diárias são do cliente.**

| Campo | Tipo | Quem define | Timezone |
|---|---|---|---|
| `created_at` | `timestamptz` | Banco (`now()`) | UTC |
| `updated_at` | `timestamptz` | Trigger (`now()`) | UTC |
| `last_sent_at` | `timestamptz` | Edge Function | UTC |
| `next_trigger_at` | `timestamptz` | Edge Function | UTC calculado |
| `date` (daily_log) | `date` | Cliente | Local do usuário |
| `start_date` (medication) | `date` | Cliente | Local do usuário |
| `reminder_time` | `time` | Cliente | Local do usuário |

### O problema da meia-noite UTC

Brasil (UTC-3) tem um janela de 3 horas onde "hoje" no cliente é diferente de `CURRENT_DATE` no servidor UTC:

```
21:00 Brasília = 00:00 UTC do dia seguinte
```

Um usuário registrando sintomas às 22:00 de terça-feira em São Paulo:
- **Correto:** `date = '2026-01-13'` (terça-feira local)
- **Errado se usar CURRENT_DATE no banco:** `date = '2026-01-14'` (quarta-feira UTC)

Isso não é um edge case — acontece todo dia para qualquer usuário que use o app à noite.

**Solução adotada:** `date` não tem `DEFAULT` no banco. O cliente sempre envia a data explicitamente.

### Exibição de timestamps

`created_at` e similares são exibidos na interface usando `toLocaleDateString` ou equivalente com locale `pt-BR`. Isso converte UTC para o timezone local do dispositivo automaticamente via APIs do browser — sem necessidade de configuração adicional.

Para evitar hydration mismatch em Server Components (que renderizam em UTC), datas formatadas usam `suppressHydrationWarning` ou são formatadas exclusivamente no cliente.

### Reminders e UTC

`next_trigger_at` é sempre calculado e armazenado em UTC. O horário local (`reminder_time`) é apenas o input humano. O banco nunca raciocina em horário local — apenas compara `next_trigger_at <= now()`.

---

## 9. Row Level Security Strategy

### Modelo: owner-only

Cada tabela tem políticas que garantem que o usuário só vê e modifica seus próprios dados. Não existe acesso cruzado entre usuários no MVP.

### Políticas por tabela

#### `profiles`
- **SELECT:** `auth.uid() = id`
- **UPDATE:** `auth.uid() = id` (USING e WITH CHECK)
- **INSERT:** Não existe policy. INSERT é feito exclusivamente pelo trigger `handle_new_user` com `SECURITY DEFINER`.
- **DELETE:** Não existe. Usuário não pode deletar o próprio perfil pela API — apenas via suporte ou Supabase Auth delete.

#### `daily_logs`
- **SELECT:** `auth.uid() = user_id`
- **INSERT:** `auth.uid() = user_id`
- **UPDATE:** `auth.uid() = user_id` (USING e WITH CHECK)
- **DELETE:** `auth.uid() = user_id`

#### `medications`
- **SELECT:** `auth.uid() = user_id`
- **INSERT:** `auth.uid() = user_id`
- **UPDATE:** `auth.uid() = user_id` (USING e WITH CHECK)
- **DELETE:** `auth.uid() = user_id`

#### `reminders` *(futuro)*
- Mesmas políticas que `medications`, usando `auth.uid() = user_id`

#### `notification_preferences` *(futuro)*
- **SELECT:** `auth.uid() = user_id`
- **UPDATE:** `auth.uid() = user_id`
- **INSERT:** `auth.uid() = user_id`

### Defense in depth

As Server Actions verificam `user_id` explicitamente antes de qualquer operação de escrita:

```ts
const { data: { user } } = await supabase.auth.getUser()
if (!user) return { error: 'Não autorizado' }

await supabase
  .from('medications')
  .update(data)
  .eq('id', id)
  .eq('user_id', user.id) // ← verificação explícita além do RLS
```

O `.eq('user_id', user.id)` na Server Action é redundante dado o RLS, mas garante que um bug de configuração de RLS não exponha dados de outros usuários. As duas camadas falham independentemente.

### Por que não usar `service_role` nas Server Actions

Server Actions usam o cliente SSR (`createServerClient`) que opera com a sessão do usuário — não com `service_role`. Isso garante que o RLS é sempre aplicado, mesmo se o código da Server Action tiver uma falha lógica de autorização.

---

## 10. Indexing Strategy

### Índices existentes (migration 001)

| Índice | Tabela | Colunas | Uso |
|---|---|---|---|
| `daily_logs_user_date_idx` | `daily_logs` | `(user_id, date DESC)` | Lista de histórico, lookup do log do dia |
| `medications_user_idx` | `medications` | `(user_id)` | Lista de medicamentos |

### Índices planejados (migration 002+)

| Índice | Tabela | Colunas | Condição | Uso |
|---|---|---|---|---|
| `medications_user_active_idx` | `medications` | `(user_id, active, created_at DESC)` | — | Ordenação padrão da lista |
| `reminders_next_trigger_idx` | `reminders` | `(next_trigger_at)` | `WHERE active = true` | Cron job de background |
| `reminders_medication_idx` | `reminders` | `(medication_id)` | — | Cascade e listagem por medicamento |

### Rationale por índice

**`daily_logs_user_date_idx (user_id, date DESC)`**
Query típica: `WHERE user_id = $1 ORDER BY date DESC LIMIT 30`. O índice composto cobre o filtro e a ordenação em uma única operação. `DESC` evita sort adicional.

**`medications_user_active_idx (user_id, active, created_at DESC)`**
Substitui o índice simples `medications_user_idx`. A query padrão é `WHERE user_id = $1 ORDER BY active DESC, created_at DESC`. O índice cobre todo o critério de ordenação.

**`reminders_next_trigger_idx (next_trigger_at) WHERE active = true`**
Índice parcial — só indexa reminders ativos. O cron job faz `WHERE active = true AND next_trigger_at <= now()`. Com o índice parcial, a query é extremamente eficiente mesmo com muitos reminders inativos no histórico.

### O que não indexar

- `profiles`: lookup sempre por PK (`id`). Nenhum índice adicional necessário.
- `notes`, `name` em qualquer tabela: não há busca textual no MVP.
- `created_at` isolado: sempre usado junto com `user_id`, coberto pelos índices compostos.

---

## 11. Future-Proofing Decisions

### Sem over-normalization

`dosage` e `frequency` em `medications` são texto livre. Não existe tabela `medication_types` ou `frequencies`. A normalização só vale quando a estrutura é usada em JOINs ou queries de agregação — o que não acontece no MVP.

### Sem event sourcing

Não há tabela de `events` ou `audit_log`. O histórico do usuário é o estado atual — não há necessidade de replay de eventos. Se o usuário atualiza um daily_log, o registro anterior é sobrescrito via UPSERT.

### Sem analytics tables ainda

Não existe `daily_summaries`, `weekly_aggregates` ou materialized views. Queries de histórico operam sobre `daily_logs` diretamente com `LIMIT 30`. Agregações futuras (médias semanais) podem ser calculadas na camada de aplicação com os dados já carregados, ou via materialized view quando o volume justificar.

### Sem optimistic sync

Não há tabela de `pending_writes` ou `sync_queue`. O modelo é request/response simples: Server Action faz o write, retorna sucesso ou erro, UI reage. Sem complexidade de sincronização offline.

### Sem offline-first

O app não funciona offline. Não há estratégia de Service Worker, cache de writes, ou reconciliação de conflitos. Essa decisão mantém o schema simples — sem campos de versão, `synced_at`, ou `client_id`.

### UUIDs por toda parte

Todos os IDs são `uuid`. Vantagens: sem dependência de sequência do banco, IDs geráveis no cliente se necessário, sem exposição de contagem de registros. `gen_random_uuid()` é a função padrão do PostgreSQL 13+.

### `text` sem limite no banco

O Supabase armazena `text` eficientemente independente do tamanho. Limites de caracteres (nome: 120, notas: 1000) são responsabilidade do Zod schema — não do banco. Isso facilita alterações de limite sem migrations.

---

## 12. Known Future Expansions

Funcionalidades planejadas que **não devem influenciar o schema atual** além do que já está documentado:

| Funcionalidade | Dependência de schema |
|---|---|
| Reminders de medicamento | `reminders` + `profiles.timezone` (Seção 7) |
| Notification queue | `notification_preferences` + fila externa ou Supabase Realtime |
| Symptom insights | Aggregation queries sobre `daily_logs` — sem schema novo |
| AI correlations | Read-only sobre dados existentes |
| Trends / médias | Computed na aplicação ou materialized views |
| Export PDF | Read-only sobre dados existentes |
| Clinician sharing | Novo schema: `shares`, permissões temporárias |
| Attachments | `storage.objects` do Supabase + FK em tabela a definir |
| Medication adherence | Campo `taken_at timestamptz[]` em `reminders` ou tabela `adherence_logs` |
| Multi-device sync | Atualmente gratuito — Supabase Realtime pode ser adicionado sem schema changes |

---

## 13. Critical Review

### Inconsistências identificadas

#### ⚠️ CRÍTICO — Divergência migration vs. código: `medications`

A `migration 001_initial_schema.sql` define a tabela `medications` com:
- Coluna `schedule text` (inexistente no código)
- Sem coluna `frequency text` (usada pelo código)
- Sem coluna `active boolean` (usada pelo código)
- Sem coluna `start_date date` (usada pelo código)

O código (`src/types/database.ts`, Server Actions, formulários) opera com o schema correto (`frequency`, `active`, `start_date`). A migration SQL está desatualizada.

**Ação necessária antes de qualquer deployment real:**
Criar `migration 002_medications_v2.sql` com:
```sql
ALTER TABLE public.medications
  DROP COLUMN IF EXISTS schedule,
  ADD COLUMN IF NOT EXISTS frequency text,
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS start_date date;
```

#### ⚠️ ALTO — `DEFAULT CURRENT_DATE` em `daily_logs.date`

A migration 001 define `date date NOT NULL DEFAULT CURRENT_DATE`. Conforme explicado na Seção 8, este default usa a data UTC do servidor e causará datas erradas para usuários brasileiros após 21:00 (Brasília).

**Ação necessária:** Remover o `DEFAULT` e garantir que toda Server Action que insere em `daily_logs` sempre receba `date` explicitamente do cliente.

#### ⚠️ MÉDIO — `profiles.timezone` ausente na migration

`profiles.timezone` está documentado neste blueprint como necessário para reminders, mas ausente na migration 001 e no `src/types/database.ts`.

**Ação necessária em Fase 6A:**
- Adicionar à migration 002: `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'America/Sao_Paulo'`
- Atualizar `src/types/database.ts` com o novo campo

#### ⚠️ MÉDIO — Índice `medications_user_idx` é subótimo

O índice atual em `(user_id)` não cobre a ordenação `ORDER BY active DESC, created_at DESC`. Cada query de listagem faz um sort adicional.

**Ação necessária em migration 002:**
```sql
DROP INDEX IF EXISTS medications_user_idx;
CREATE INDEX medications_user_active_idx
  ON public.medications (user_id, active DESC, created_at DESC);
```

### Riscos futuros

**Timezone em travel:** Usuário viaja de São Paulo para Manaus (UTC-4) e registra às 21:30. A data enviada pelo cliente será correta para Manaus, mas se `profiles.timezone` ainda diz `America/Sao_Paulo`, reminders calcularão com o timezone errado. Solução: quando reminders forem implementados, perguntar ao usuário para confirmar o timezone explicitamente na configuração do reminder.

**UPSERT race condition:** Se o usuário abre o app em dois dispositivos simultaneamente e submete o daily_log em ambos ao mesmo tempo, o UPSERT garante que não haverá dois registros, mas o "vencedor" será o último a chegar ao banco. Isso é aceitável para o caso de uso atual.

**Crescimento de `daily_logs`:** Com 1 log/dia, um usuário ativo gera ~365 rows/ano. Com 10.000 usuários ativos, são ~3.6M rows/ano. O índice `(user_id, date DESC)` mantém as queries eficientes por partição de usuário independente do volume total. Particionamento de tabela não é necessário até ~100M rows.

**Backup de `notes`:** Campos de texto livre não têm backup incremental no app. Se o usuário apaga acidentalmente as notas, não há undo. Para a fase atual, isso é aceitável. Futuramente, soft delete ou `notes_history` pode ser considerado.

### Supabase compatibility

- `gen_random_uuid()`: disponível no PostgreSQL 13+ (Supabase usa 15+). ✓
- `timestamptz`: armazenado e retornado em UTC pelo Supabase client. ✓
- `smallint CHECK`: enforced no banco, complementado pelo Zod no frontend. ✓
- `SECURITY DEFINER SET search_path = public`: proteção contra search path injection. ✓
- RLS habilitado em todas as tabelas públicas. ✓
- `auth.uid()` em políticas: disponível nativamente no Supabase. ✓

### Migration readiness

| Artefato | Status |
|---|---|
| `001_initial_schema.sql` | Incompleto — `medications` desatualizado |
| `002_medications_v2.sql` | Pendente — deve ser criado antes de qualquer deploy |
| `src/types/database.ts` | Correto para o schema alvo (não para a migration 001) |
| RLS policies | Corretas na migration 001 |
| Triggers | Corretos na migration 001 |
| `profiles.timezone` | Ausente em migration e types — necessário para Fase 6A |
