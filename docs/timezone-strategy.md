# Timezone Strategy — VivaLeve

## Problema Central

Reminders de saúde precisam disparar no horário certo **na perspectiva do usuário**, independente do servidor ou da timezone do banco de dados. A fibromialgia é uma condição de saúde onde a consistência dos horários de medicação é crítica — um lembrete atrasado ou adiantado por uma hora pode afetar o tratamento.

---

## Modelo de Dados: Três Colunas Distintas

```sql
time_local   TIME        NOT NULL   -- "08:00" — o que o usuário configura
timezone     TEXT        NOT NULL   -- "America/Sao_Paulo" — snapshot IANA no momento de salvar
next_trigger_at TIMESTAMPTZ         -- UTC computado, atualizado pelo servidor
```

### Por que `time_local` é `TIME` sem timezone?

- Representa a **intenção do usuário**: "quero ser lembrado às 8h da manhã"
- Não muda com DST ou mudança de cidade — é a âncora cognitiva
- O banco não interpreta; apenas armazena a string semântica

### Por que `timezone` é um snapshot?

- O timezone é capturado no momento do save (create ou update)
- Se o usuário viajar, reminders antigos continuam no fuso original (comportamento correto — ele não editou)
- Editar um reminder sincroniza o timezone com o perfil atual (`getUserTimezone`)
- Isso é o mesmo comportamento do Google Calendar

### Por que `next_trigger_at` é recomputado no servidor?

- Permite consulta eficiente: `WHERE next_trigger_at <= now() AND active = true`
- Índice parcial `WHERE active = true` no `next_trigger_at` para cron futuro
- O cliente nunca calcula — apenas exibe; o servidor é a fonte de verdade

---

## O Bug `DEFAULT CURRENT_DATE` no PostgreSQL

```sql
-- ERRADO — causa bug para usuários brasileiros após 21h (BRT = UTC-3)
date DATE NOT NULL DEFAULT CURRENT_DATE

-- CERTO — sem default; a aplicação passa a data local explicitamente
date DATE NOT NULL
```

**Por que isso falha:** `CURRENT_DATE` no PostgreSQL usa UTC. Um usuário em São Paulo às 22h (BRT) está no dia seguinte em UTC. O `daily_log` seria criado com a data "errada" do ponto de vista do usuário.

**A solução adotada:** O Server Action recebe a data como parâmetro da camada de aplicação, que já tem acesso à timezone do usuário. Migration 002 remove o `DEFAULT`.

---

## Algoritmo `computeNextTriggerAt`

Localização: `src/features/reminders/utils/scheduling.ts`

### Problema: Converter "HH:MM" + IANA timezone → UTC

Não existe uma API nativa limpa para isso. `Date` em JavaScript sempre opera em UTC ou no timezone local do processo Node.js — que pode ser UTC no servidor de produção.

### Abordagem: Seed + Correção via Intl

```
1. Seed UTC:    new Date(Date.UTC(y, mo-1, d, h, m, 0, 0))
   (trata os componentes locais como se fossem UTC)

2. Medir offset: Intl.DateTimeFormat com timeZone fornecida
   → extrai HH, MM da representação formatada
   → calcula diff entre "local" e UTC da seed

3. Corrigir:    seedUtc + diff (em minutos) → localToUtcCandidate

4. Verificar:   formatar novamente com Intl → comparar HH:MM
   Se diferir (DST boundary): tentar ±60 minutos

5. Dia:         Se o resultado cair no passado (< from), avançar 1 dia
```

### Por que não usar `date-fns-tz` ou `luxon`?

- Adiciona ~60KB ao bundle por funcionalidade usada em 4 funções
- O algoritmo acima cobre 99,9% dos casos com zero dependências
- Casos edge (DST ambíguo) estão documentados e são aceitáveis para wellness app

### Limitação Conhecida: DST "Fall Back"

Quando os relógios recuam (ex: no Brasil, o horário de verão — embora raro), existe uma hora ambígua que ocorre duas vezes. O algoritmo resolve para a **primeira ocorrência** (antes do recuo). Para wellness reminders isso é aceitável — o usuário é lembrado, possivelmente uma hora cedo, mas não perde o lembrete.

---

## Ciclo de Vida de `next_trigger_at`

```
CREATE reminder
  → computeNextTriggerAt(time_local, timezone)
  → INSERT com next_trigger_at

EDIT reminder
  → getUserTimezone(user.id)  ← sincroniza timezone com perfil atual
  → computeNextTriggerAt(time_local, timezone_novo)
  → UPDATE com novo next_trigger_at

TOGGLE active=false
  → UPDATE apenas active=false
  → next_trigger_at mantido (índice parcial WHERE active=true o ignora)

TOGGLE active=true
  → getUserTimezone(user.id)
  → SELECT time_local, timezone FROM reminders WHERE id=...
  → computeNextTriggerAt → atualiza next_trigger_at
```

---

## Propagação de Timezone no Perfil

O campo `profiles.timezone` é a fonte primária para novos reminders e para edições.

```
profiles.timezone  (IANA string, ex: "America/Sao_Paulo")
    ↓ lida por getUserTimezone() em cada Server Action
reminders.timezone (snapshot por reminder)
```

**Quando sincronizar:** Apenas em create e update explícito. Nunca em background.

**Fallback:** Se o perfil não existir ou timezone estiver vazio, usa `DEFAULT_TIMEZONE = "America/Sao_Paulo"` — comportamento razoável dado o público-alvo do app.

---

## Formato de Armazenamento e Exibição

| Dado          | Armazenado como       | Exibido como  |
|---------------|-----------------------|---------------|
| `time_local`  | `"08:00:00"` (TIME)   | `"08h00"`     |
| `timezone`    | `"America/Sao_Paulo"` | não exibido   |
| `next_trigger_at` | ISO 8601 UTC     | não exibido   |

**`normalizeTimeLocal(raw)`:** Corta para `"HH:MM"` — o banco retorna `"08:00:00"` mas o form e a lógica de scheduling usam apenas `"HH:MM"`.

**`formatTimeDisplay(timeLocal)`:** Converte `"08:00"` → `"08h00"` para o card visual.

---

## Considerações Futuras: Edge Functions

Quando as notificações forem implementadas (fora do MVP), o padrão correto é:

```sql
-- O cron query que a Edge Function usaria
SELECT r.*, p.timezone AS profile_timezone
FROM reminders r
JOIN profiles p ON p.id = r.user_id
WHERE r.next_trigger_at <= now()
  AND r.active = true
ORDER BY r.next_trigger_at ASC
LIMIT 100;
```

Após enviar a notificação:
```sql
UPDATE reminders
SET
  last_sent_at = now(),
  next_trigger_at = computeNextTriggerAt(time_local, timezone, now())
WHERE id = ...;
```

O índice parcial `reminders_next_trigger_idx WHERE active = true` foi projetado exatamente para este query.

---

## Decisões de Arquitetura: O Que NÃO Fazer

| Tentação                             | Por quê evitar                                        |
|--------------------------------------|-------------------------------------------------------|
| Usar `new Date().toLocaleString()`   | Depende do timezone do processo Node.js               |
| Armazenar apenas UTC                 | Perde a intenção do usuário; difícil de exibir        |
| Usar `date-fns-tz`                   | Dependência desnecessária para este escopo            |
| Recalcular no cliente                | user_id e timezone vêm do servidor; cliente não tem   |
| `DEFAULT CURRENT_DATE` no PostgreSQL | UTC vs horário local — bug silencioso para BR após 21h|
| Armazenar timezone por sessão        | Timezone é propriedade do reminder, não da sessão     |
