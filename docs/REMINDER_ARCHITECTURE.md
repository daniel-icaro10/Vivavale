# REMINDER ARCHITECTURE — VivaLeve
> **Status:** Oficial. Documenta o que existe hoje e o que será implementado.
> **Última revisão:** 2026-05-13
> **Fase atual:** Foundation (Phase 7) — persistência sem entrega de notificações.

---

## 1. Estado Atual vs. Futuro

### O que existe hoje (Phase 7 — Foundation)

- Tabela `reminders` com schema completo e timezone-safe
- Tabela `notification_preferences` com estrutura de quiet hours
- Server Actions: create, update, delete, toggle
- Cálculo de `next_trigger_at` em UTC (sem envio)
- UI completa: lista, formulário, card, estados de delete e toggle
- RLS em todas as tabelas
- Índice parcial para cron futuro

### O que NÃO existe (deliberadamente adiado)

- Envio de notificações push
- Service Workers
- Cron jobs reais (pg_cron)
- Edge Functions de envio
- Integração com FCM / APNs / OneSignal
- Subscriptions de browser push
- Polling no cliente
- Realtime subscriptions

### Por que adiar

O MVP valida o core loop de saúde (registro e consciência). A entrega por push requer:
1. Permissão de browser (UX sensível — pedir no momento errado reduz opt-in)
2. Service Worker (estado fora do React)
3. Edge Function Deno (stack diferente do Next.js)
4. pg_cron (requer habilitação no Dashboard do Supabase)

Esses investimentos fazem sentido após validação do produto com usuários reais.

---

## 2. Schema do Reminder

```sql
CREATE TABLE public.reminders (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medication_id   uuid        NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  time_local      time        NOT NULL,
  timezone        text        NOT NULL,
  recurrence      text        NOT NULL DEFAULT 'daily'
                  CHECK (recurrence IN ('daily', 'weekdays', 'custom_future')),
  active          boolean     NOT NULL DEFAULT true,
  last_sent_at    timestamptz,
  next_trigger_at timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
```

### Semântica dos campos

| Campo | Semântica |
|---|---|
| `time_local` | Horário percebido pelo usuário. "08:00" = "lembrar às 8h da manhã". Imutável à viagem. |
| `timezone` | Snapshot IANA do timezone no momento da criação/edição. Não sincroniza automaticamente. |
| `recurrence` | Frequência de disparo. `daily` = todos os dias. `weekdays` = seg–sex. |
| `active` | Controle de pausa. `false` = lembrete pausado, mantido no banco. |
| `last_sent_at` | UTC do último envio bem-sucedido. `NULL` se nunca enviado. Atualizado pela Edge Function. |
| `next_trigger_at` | UTC do próximo disparo. Calculado pelo Server Action. Avançado pela Edge Function. |

---

## 3. Modelo de Recorrência

### Valores suportados atualmente

| Valor | Comportamento | UI Label |
|---|---|---|
| `daily` | Todos os dias | "Todos os dias" |
| `weekdays` | Segunda a sexta (seg–sex) | "Dias úteis (seg–sex)" |
| `custom_future` | Reservado — não implementado | "Personalizado" (fallback display) |

### `custom_future` — valor reservado

`custom_future` existe no CHECK constraint e no tipo TypeScript, mas **não pode ser criado via Server Actions** (Zod schema de reminders só aceita `"daily" | "weekdays"`). Foi inserido no schema para evitar uma migration futura para adicionar o valor ao CHECK.

Se um reminder com `recurrence = "custom_future"` existir no banco (inserido diretamente), ele aparece na UI com label "Personalizado". O form de edição não consegue submeter este valor (Zod rejeita) — comportamento aceitável para uma feature reservada.

### Limitação atual de `weekdays`

`computeNextTriggerAt` **não considera a recorrência**. Ele calcula a próxima ocorrência como se o reminder fosse `daily`. Isso significa que para um reminder `weekdays` criado numa sexta-feira às 14h (horário já passou), `next_trigger_at` é calculado para sábado.

**Impacto no MVP:** zero (sem Edge Function para enviar notificações). O índice e o banco armazenam o valor, mas ninguém o consome para envio.

**Correção necessária na Phase 8:** `computeNextTriggerAt` deve aceitar `recurrence` e calcular corretamente para `weekdays`:

```typescript
// Algoritmo correto para weekdays (a implementar na Phase 8)
export function computeNextTriggerAt(
  timeLocal: string,
  timezone: string,
  recurrence: "daily" | "weekdays" = "daily",
  from: Date = new Date(),
): Date {
  let candidate = computeDailyNext(timeLocal, timezone, from);
  if (recurrence === "weekdays") {
    while (isWeekend(candidate, timezone)) {
      candidate = computeDailyNext(timeLocal, timezone, candidate);
    }
  }
  return candidate;
}

function isWeekend(utc: Date, timezone: string): boolean {
  const { weekday } = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
  }).formatToParts(utc).reduce(...)
  // sábado (6) ou domingo (0)
}
```

O dia da semana deve ser calculado no timezone local do usuário, não em UTC.

---

## 4. Semântica de active/inactive

| Estado | `active` | Visibilidade | `next_trigger_at` | Índice parcial |
|---|---|---|---|---|
| Ativo | `true` | Exibido com opacidade normal | Futuro | Incluído |
| Pausado | `false` | Exibido com opacidade reduzida + badge "Pausado" | Possivelmente passado | Excluído |

### Regras de toggle

- `active = false` (pausar): apenas atualiza `active`. `next_trigger_at` mantido como está (o índice parcial `WHERE active = true` o exclui do scan do cron).
- `active = true` (reativar): recalcula `next_trigger_at` com o timezone atual do perfil. Garante que o primeiro disparo após reativação ocorra no momento correto.

### Cascade do medication

Quando um medication é deletado (hard delete), todos os seus reminders são removidos via `ON DELETE CASCADE`. A UI de medicamentos não avisa sobre reminders dependentes — melhoria prevista para versão futura.

---

## 5. Ownership Validation

Toda operação em reminders valida ownership em dois níveis:

```
Nível 1 — Server Action (código)
  supabase.auth.getUser() → user.id
  .eq("user_id", user.id) em toda query de write
  assertMedicationOwnership(medication_id, user.id) em create/update

Nível 2 — RLS (banco)
  auth.uid() = user_id em todas as policies
```

As duas camadas são independentes. Se uma falhar, a outra ainda protege.

`assertMedicationOwnership` previne que um usuário crie um reminder referenciando o medication_id de outro usuário (possível via manipulação de payload). O RLS sozinho não previne isso diretamente — o INSERT em `reminders` com `user_id = auth.uid()` passaria no RLS, mas criaria um reminder referenciando o medication de outro usuário.

---

## 6. Fluxo Futuro de Notificação (Phase 8)

```
┌──────────────────────────────────────────────────────────────────┐
│                    ARQUITETURA PHASE 8                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  pg_cron (a cada minuto)                                         │
│  └── SELECT net.http_post(edge_function_url)                    │
│                                                                  │
│  Edge Function: send-reminders                                   │
│  └── Query:                                                      │
│      SELECT r.*, np.reminders_enabled, np.quiet_hours_start,    │
│             np.quiet_hours_end, np.timezone AS pref_timezone     │
│      FROM reminders r                                            │
│      JOIN notification_preferences np ON np.user_id = r.user_id │
│      WHERE r.active = true                                       │
│        AND r.next_trigger_at <= now()                            │
│                                                                  │
│  Para cada reminder:                                             │
│    1. Verificar np.reminders_enabled                             │
│    2. Verificar quiet hours (usando np.timezone)                 │
│    3. Buscar push_subscription do usuário                        │
│    4. Enviar via Web Push                                        │
│    5. UPDATE reminders SET                                       │
│         last_sent_at = now(),                                    │
│         next_trigger_at = próxima_ocorrência(recurrence)         │
│       WHERE id = reminder.id                                     │
│    6. Em caso de erro: incrementar error_count                   │
│                        registrar last_error                      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Tabela adicional necessária (Phase 8)

```sql
CREATE TABLE public.push_subscriptions (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint  text NOT NULL,
  p256dh    text NOT NULL,
  auth_key  text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### Campos adicionais em `reminders` (Phase 8, migration 004)

```sql
ALTER TABLE public.reminders
  ADD COLUMN IF NOT EXISTS last_error text,
  ADD COLUMN IF NOT EXISTS error_count integer NOT NULL DEFAULT 0;
```

---

## 7. Quiet Hours

A tabela `notification_preferences` tem `quiet_hours_start` e `quiet_hours_end` (tipo `time`, sem timezone próprio — interpretado usando `notification_preferences.timezone`).

### Semântica

- `quiet_hours_start = 22:00`, `quiet_hours_end = 07:00`: notificações suprimidas das 22h às 7h do dia seguinte (cruza meia-noite)
- `quiet_hours_start = 23:00`, `quiet_hours_end = 06:00`: silencioso das 23h às 6h
- Ambos `NULL`: sem período silencioso

### Lógica de verificação (a implementar na Phase 8)

```typescript
function isInQuietHours(
  now: Date,
  quietStart: string | null,  // "HH:MM"
  quietEnd: string | null,    // "HH:MM"
  timezone: string,
): boolean {
  if (!quietStart || !quietEnd) return false;
  
  const { h, m } = getLocalHM(now, timezone);
  const currentMin = h * 60 + m;
  const startMin = parseHHMM(quietStart);
  const endMin = parseHHMM(quietEnd);
  
  if (startMin <= endMin) {
    // Não cruza meia-noite: 08:00–22:00
    return currentMin >= startMin && currentMin < endMin;
  } else {
    // Cruza meia-noite: 22:00–07:00
    return currentMin >= startMin || currentMin < endMin;
  }
}
```

### Constraint ausente (a adicionar na Phase 8 — migration 004)

```sql
ALTER TABLE public.notification_preferences
  ADD CONSTRAINT quiet_hours_consistent
  CHECK ((quiet_hours_start IS NULL) = (quiet_hours_end IS NULL));
```

Previne estado inconsistente (só start sem end ou vice-versa).

---

## 8. Índice Parcial e Performance

```sql
CREATE INDEX reminders_next_trigger_idx
  ON public.reminders (next_trigger_at)
  WHERE active = true;
```

O índice parcial indexa **apenas reminders ativos**. Isso garante:

1. O scan do cron (`WHERE active = true AND next_trigger_at <= now()`) é extremamente eficiente
2. Reminders pausados (`active = false`) não inflam o índice mesmo após meses histórico
3. Com 10.000 usuários e média de 3 reminders ativos/usuário = ~30.000 entradas no índice — trivial para PostgreSQL

---

## 9. Filosofia de Design

### Por que `user_id` é redundante em `reminders`

Tecnicamente, o `user_id` poderia ser derivado via `medication_id → medications.user_id`. Mantemos `user_id` direto por:

1. **RLS**: `auth.uid() = user_id` é uma comparação direta, sem JOIN
2. **Performance**: queries de listagem do usuário usam `WHERE user_id = $1` sem subquery
3. **Defense in depth**: Server Actions verificam `user_id` explicitamente
4. **Future**: Edge Function pode buscar reminders de um usuário sem JOIN

### Por que não usar RRULE

RRULE (iCal recurrence rules) suportaria recorrências complexas (semanal, quinzenal, dia específico do mês). Não foi adotado porque:

1. A interface para configurar RRULE é complexa (bad UX para público com fadiga mental)
2. `daily` e `weekdays` cobrem 95%+ dos casos de uso de medicação
3. A engine RRULE em JavaScript/Deno adiciona complexidade sem benefício claro no MVP
4. O valor reservado `custom_future` permite adicionar RRULE futuramente sem schema change

### Por que `next_trigger_at` é nullable

`next_trigger_at` pode ser `NULL` até o primeiro cálculo. Em teoria, o Server Action sempre calcula e seta. Na prática, deixamos nullable para:
1. Não forçar um cálculo em paths de código que não precisam (ex: import de dados)
2. A Edge Function deve tratar `NULL` como "nunca calculado" e calcular na hora
3. Facilitar testes onde `next_trigger_at` pode ser omitido intencionalmente
