# TIMEZONE STRATEGY — VivaLeve
> **Status:** Oficial. Fonte de verdade para toda lógica de timezone no projeto.
> **Última revisão:** 2026-05-13
> **Escopo:** Banco de dados, Server Actions, scheduling, reminders.

---

## 1. Princípio Fundamental

> **Timestamps são UTC. Datas diárias e horários de lembrete são do cliente.**

O banco de dados opera em UTC. O usuário opera no seu timezone local. A aplicação é responsável por traduzir entre os dois. Nunca delegar "qual data é hoje" ou "qual horário disparar" ao servidor PostgreSQL.

---

## 2. Mapa de Campos e Timezones

| Campo | Tabela | Tipo PostgreSQL | Quem define | Timezone |
|---|---|---|---|---|
| `created_at` | todas | `timestamptz` | Banco (`now()`) | UTC |
| `updated_at` | todas | `timestamptz` | Trigger (`now()`) | UTC |
| `last_sent_at` | `reminders` | `timestamptz` | Edge Function futura | UTC |
| `next_trigger_at` | `reminders` | `timestamptz` | Server Action | UTC calculado |
| `date` | `daily_logs` | `date` | Cliente | Local do usuário |
| `start_date` | `medications` | `date` | Cliente | Local do usuário |
| `time_local` | `reminders` | `time` | Cliente | Local do usuário |
| `timezone` | `profiles` | `text` | Aplicação / usuário | IANA string |
| `timezone` | `reminders` | `text` | Server Action (snapshot) | IANA string |
| `timezone` | `notification_preferences` | `text` | Aplicação | IANA string |
| `quiet_hours_start` | `notification_preferences` | `time` | Cliente | Local do usuário |
| `quiet_hours_end` | `notification_preferences` | `time` | Cliente | Local do usuário |

---

## 3. O Bug da Meia-Noite UTC

### Por que `DEFAULT CURRENT_DATE` é errado

O PostgreSQL usa `CURRENT_DATE` como a data atual **em UTC**, não no timezone do usuário.

**Cenário concreto — Brasil (UTC-3):**
```
Usuário em São Paulo, terça-feira, 22:30 local
→ No servidor UTC: quarta-feira, 01:30

SELECT CURRENT_DATE;  -- retorna quarta-feira
```

Um usuário registrando sintomas às 22:30 de terça-feira receberia `date = quarta-feira` — **o dia errado** para ele.

**Janela de risco diária:**
- Brasil (UTC-3): das 21:00 às 00:00 local (3 horas/dia)
- Acre (UTC-5): das 19:00 às 00:00 local (5 horas/dia)
- Manaus (UTC-4): das 20:00 às 00:00 local (4 horas/dia)

Este não é um edge case — acontece **todo dia** para qualquer usuário que use o app à noite.

### Solução adotada

`date` em `daily_logs` não tem `DEFAULT` no banco. A data é sempre enviada pelo cliente:

```typescript
// Cliente calcula e envia a data local
const today = new Date().toLocaleDateString('en-CA'); // → "2026-01-13"
// en-CA produz formato YYYY-MM-DD necessário para o tipo date do PostgreSQL
```

Migration 002 remove o `DEFAULT CURRENT_DATE`:
```sql
ALTER TABLE public.daily_logs ALTER COLUMN date DROP DEFAULT;
```

---

## 4. Arquitetura de Três Colunas em Reminders

O sistema de lembretes usa três colunas com semânticas distintas:

```
time_local      TIME        -- "08:00"              — intenção do usuário
timezone        TEXT        -- "America/Sao_Paulo"   — fuso no momento de criação
next_trigger_at TIMESTAMPTZ -- "2026-01-13 11:00:00Z" — UTC calculado
```

### `time_local` — a âncora cognitiva

Representa o que o usuário configurou: "quero ser lembrado às 8h da manhã".

- Tipo `time` do PostgreSQL: armazenado como `HH:MM:SS`, retornado como `HH:MM:SS`
- Normalizado para `HH:MM` na aplicação via `normalizeTimeLocal(raw)`
- **Não muda** se o usuário viaja ou muda de timezone
- É a fonte de verdade da *intenção* do usuário

### `timezone` — snapshot IANA

Capturado no momento de `CREATE` ou `UPDATE` do reminder.

- Vem de `profiles.timezone` via `getUserTimezone(userId)` nas Server Actions
- É um snapshot: se o usuário atualizar seu timezone depois, este campo **não muda automaticamente**
- Garante que o lembrete continue no timezone original até o usuário editá-lo explicitamente
- Mesmo comportamento do Google Calendar ao criar eventos em viagem

### `next_trigger_at` — UTC calculado

Resultado da computação `time_local + timezone → UTC`.

- Calculado pelo Server Action no create e update
- Recalculado pelo `toggleReminderAction` quando o reminder é reativado
- Futuro: mantido pela Edge Function após cada envio (avança para próxima ocorrência)
- O banco compara `next_trigger_at <= now()` para encontrar reminders pendentes

---

## 5. `profiles.timezone` — Fonte Primária

O campo `profiles.timezone` é a **fonte oficial de timezone** do usuário para novos reminders.

```sql
-- migration 002
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'America/Sao_Paulo';
```

**Default:** `America/Sao_Paulo` (UTC-3) — timezone da maioria dos usuários brasileiros.

**Responsabilidade:** O usuário pode atualizar este campo nas configurações de perfil. Quando atualizado, **apenas novos reminders e reminders editados** passam a usar o novo timezone. Reminders existentes não são alterados.

### Hierarquia de timezone nas Server Actions

```
1. profiles.timezone (via getUserTimezone)
   ↓ fallback se perfil não existir
2. DEFAULT_TIMEZONE = "America/Sao_Paulo"
   ↓ nunca usa
3. Client-side timezone (nunca lido — user_id vem do servidor)
```

---

## 6. Algoritmo de Conversão `localToUtc`

Localização: `src/features/reminders/utils/scheduling.ts`

### Problema

JavaScript não tem API nativa para "converta 08:00 em America/Sao_Paulo para UTC". `new Date()` e `Date.UTC()` operam no timezone do processo Node.js (UTC em produção).

### Solução: Seed + Correção via Intl

```
Passo 1 — Seed UTC
  Cria um Date.UTC tratando os componentes locais como se fossem UTC
  Seed = Date.UTC(y, mo-1, d, h, m, 0)

Passo 2 — Medir offset real
  Formata o Seed com Intl.DateTimeFormat({timeZone: timezone})
  Extrai hora e minuto locais do Seed
  Calcula diff = (h_local_esperado - h_local_seed) * 60 + (m_esperado - m_seed)

Passo 3 — Normalizar o shift
  Normaliza para [-720, 720] para evitar saltos de mais de 12h
  (Necessário quando o dia da seed é diferente do dia local)

Passo 4 — Corrigir
  result = seed + diff_em_ms

Passo 5 — Verificar (DST safety)
  Formata result com Intl, compara HH:MM
  Se diferir → DST boundary crossed durante o shift
  Tenta result ± 60 minutos
  Se convergir → retorna
  Se não convergir → retorna melhor aproximação (spring-forward gap)
```

### Exemplo concreto

```
Input:  time_local = "08:00", timezone = "America/Sao_Paulo" (UTC-3)
Seed:   Date.UTC(2026, 0, 13, 8, 0) → 08:00 UTC (trata como UTC)
Intl:   08:00 UTC em America/Sao_Paulo = 05:00 local
Diff:   (8 - 5) * 60 = +180 minutos
Result: 08:00 UTC + 180min = 11:00 UTC
Verify: 11:00 UTC em America/Sao_Paulo = 08:00 ✓

Output: 2026-01-13T11:00:00.000Z
```

---

## 7. Ciclo de Vida de `next_trigger_at`

```
┌─────────────────────────────────────────────────────────────────┐
│                    EVENTO                    │  AÇÃO             │
├─────────────────────────────────────────────────────────────────┤
│ createReminderAction                         │                   │
│   → getUserTimezone(userId)                  │                   │
│   → computeNextTriggerAt(time_local, tz)     │ SET next_trigger  │
│   → INSERT com next_trigger_at               │                   │
├─────────────────────────────────────────────────────────────────┤
│ updateReminderAction                         │                   │
│   → getUserTimezone(userId)  ← sincroniza tz │                   │
│   → computeNextTriggerAt(time_local, tz_novo)│ SET next_trigger  │
│   → UPDATE com novo next_trigger_at          │                   │
├─────────────────────────────────────────────────────────────────┤
│ toggleReminderAction(active = false)         │                   │
│   → UPDATE active = false                    │ MANTÉM next_trigger│
│   → next_trigger_at não alterado             │ (índice o ignora) │
├─────────────────────────────────────────────────────────────────┤
│ toggleReminderAction(active = true)          │                   │
│   → getUserTimezone(userId)                  │                   │
│   → SELECT time_local, timezone FROM reminder│                   │
│   → computeNextTriggerAt(time_local, tz)     │ RECALCULA         │
│   → UPDATE active = true, next_trigger_at    │                   │
├─────────────────────────────────────────────────────────────────┤
│ Edge Function pós-envio (Phase 8 — futuro)   │                   │
│   → UPDATE last_sent_at = now()              │ AVANÇA            │
│   → computeNextTriggerAt(time_local, timezone│ para próxima     │
│          recurrence, from = now())           │ ocorrência        │
└─────────────────────────────────────────────────────────────────┘
```

**Invariante:** quando `active = true`, `next_trigger_at` sempre contém a próxima ocorrência futura válida (ou a mais recente calculada). Quando `active = false`, `next_trigger_at` pode estar no passado — o índice parcial `WHERE active = true` exclui estes registros do cron scan.

---

## 8. DST — Daylight Saving Time

### Status do Brasil

O Brasil encerrou o horário de verão oficialmente em 2019. Timezone `America/Sao_Paulo`, `America/Manaus`, `America/Recife` não têm DST atualmente.

O algoritmo suporta DST por design para compatibilidade com outros fusos (expansão futura).

### Spring Forward (relógio adianta)

Exemplo: na transição, 02:00 local "pula" para 03:00. O horário 02:30 não existe.

**Comportamento do algoritmo:** tenta ±60min. Se o horário for dentro da hora pulada, retorna a melhor aproximação (máximo 1h de erro, 1× por ano durante a transição).

### Fall Back (relógio atrasa)

Exemplo: na transição, 02:00 local acontece duas vezes.

**Comportamento do algoritmo:** resolve para a **primeira ocorrência** (antes do recuo). Para wellness reminders, este comportamento é aceitável — o usuário é lembrado na primeira vez que aquele horário ocorre, possivelmente 1h mais cedo que o esperado.

**Frequência:** máximo 1× por ano, apenas em fusos com DST ativo. Para o Brasil (sem DST), este caso nunca acontece.

---

## 9. Cenário de Viagem (Travel Timezone)

### O que acontece

Usuário em São Paulo (`profiles.timezone = "America/Sao_Paulo"`) viaja para Miami.

| Estado | Behavior |
|---|---|
| Reminders existentes | Continuam com `timezone = "America/Sao_Paulo"` — disparam no horário de SP |
| Novos reminders criados em Miami | `getUserTimezone()` retorna `"America/Sao_Paulo"` — ainda usa timezone de SP |
| Usuário edita um reminder em Miami | `getUserTimezone()` retorna SP — timezone não muda automaticamente |

### Solução correta

O usuário deve atualizar `profiles.timezone` nas configurações de perfil. Após isso:
- Novos reminders usam o novo timezone
- Reminders editados explicitamente usam o novo timezone
- Reminders não editados continuam no timezone original

**Esta é uma decisão de UX intencional.** Atualizar silenciosamente o timezone de todos os reminders causaria confusão ("configurei para 08:00 de SP mas agora dispara às 11:00 de Miami?").

### Risco conhecido

Não existe UI de timezone no MVP. Todos os usuários partem de `"America/Sao_Paulo"`. Para usuários no Acre (UTC-5) ou Amazonas (UTC-4), reminders terão um desvio de 1–2h. Aceitável para o público-alvo atual (maioria em UTC-3).

---

## 10. Validação de IANA Timezone

```typescript
export function isValidIANATimezone(tz: string): boolean {
  if (!tz || tz.length < 3) return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
```

- Valida contra o banco de dados IANA do ambiente de execução (Node.js / V8)
- Sem lista estática — aceita qualquer timezone reconhecido pelo runtime
- Usado pelo Zod schema de reminders para validar `timezone`
- Fallback: `DEFAULT_TIMEZONE = "America/Sao_Paulo"` quando `profiles.timezone` não existe

---

## 11. Normalização e Exibição

### Banco → Aplicação

```typescript
// PostgreSQL `time` retorna "HH:MM:SS"
// Normalizar para "HH:MM" antes de qualquer uso
export function normalizeTimeLocal(raw: string): string {
  return raw.slice(0, 5); // "08:00:00" → "08:00"
}
```

### Aplicação → Usuário

```typescript
// "HH:MM" → "08h00" (formato pt-BR)
export function formatTimeDisplay(timeLocal: string): string {
  const [h, m] = normalizeTimeLocal(timeLocal).split(":");
  return `${h}h${m}`;
}
```

### Timestamps UTC → Exibição Local

Timestamps como `created_at` são exibidos via APIs do browser (`toLocaleDateString`, `toLocaleTimeString`) que convertem UTC para o timezone local do dispositivo automaticamente.

**Risco de hydration mismatch em Server Components:** Server Components renderizam em UTC (servidor); o browser mostra em timezone local. Evitar formatar timestamps em Server Components quando o resultado é diferente por timezone.

---

## 12. Proibições Absolutes de Timezone

```typescript
// ❌ PROIBIDO: offset hardcoded
const utc = localDate - 3 * 60 * 60 * 1000; // UTC-3 hardcoded

// ❌ PROIBIDO: Date.toLocaleString() no servidor
// Node.js em produção (Vercel) roda em UTC — toLocaleString() não reflete
// o timezone do usuário
const localStr = new Date().toLocaleString('pt-BR');

// ❌ PROIBIDO: DEFAULT CURRENT_DATE no PostgreSQL
date date NOT NULL DEFAULT CURRENT_DATE;

// ❌ PROIBIDO: timezone no cliente sem validação servidor
// user_id e timezone vêm sempre do servidor, nunca do body da request
const timezone = req.body.timezone; // ← NUNCA

// ❌ PROIBIDO: comparar horário local com now() diretamente
// O cron deve comparar next_trigger_at (UTC) com now(), nunca time_local
WHERE time_local <= CURRENT_TIME -- ERRADO
```

```typescript
// ✅ CORRETO: usar computeNextTriggerAt com Intl
const nextTrigger = computeNextTriggerAt(timeLocal, timezone);

// ✅ CORRETO: data local enviada pelo cliente
const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

// ✅ CORRETO: timezone do servidor (profiles)
const timezone = await getUserTimezone(userId);
```
