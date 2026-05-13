# Scheduling Plan — Notificações Futuras no VivaLeve

## Status Atual (MVP — Fase 7)

O sistema de lembretes **armazena** e **exibe** reminders, mas **não envia notificações**. A infraestrutura foi projetada para suportar entrega futura sem refatoração de schema.

O que existe agora:
- Tabela `reminders` com `next_trigger_at` (UTC computado)
- Tabela `notification_preferences` com configurações de quiet hours
- Índice parcial `reminders_next_trigger_idx WHERE active = true`
- Server Actions para CRUD + toggle
- UX completa (card, form, list, empty state)

O que **não** existe no MVP:
- Push notifications
- Service Workers
- Cron jobs reais
- Edge Functions de envio
- Firebase / OneSignal / APNs / FCM

---

## Arquitetura Planejada para Notificações

### Componentes Necessários

```
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE INFRASTRUCTURE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  pg_cron (Postgres extension)                                   │
│  └── Roda a cada minuto: PERFORM net.http_post(edge_fn_url)     │
│                                                                 │
│  Supabase Edge Function: send-reminders                         │
│  └── Query: reminders WHERE next_trigger_at <= now()            │
│  └── Para cada reminder: envia notificação + atualiza           │
│      next_trigger_at para próxima ocorrência                    │
│                                                                 │
│  Supabase Edge Function: schedule-reminder                      │
│  └── Chamada após create/update de reminder                     │
│  └── (Alternativa ao cálculo no Server Action)                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    DELIVERY PROVIDERS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Web Push (PWA)                                                 │
│  └── Browser Notification API + Service Worker                  │
│  └── VAPID keys armazenadas em Supabase Vault                   │
│  └── Subscriptions na tabela push_subscriptions                 │
│                                                                 │
│  Mobile Push (futuro)                                           │
│  └── FCM para Android / APNs para iOS                           │
│  └── Expo Notifications se app React Native for criado          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Fluxo Completo

```
1. Usuário configura reminder (já implementado)
   → computeNextTriggerAt() → INSERT com next_trigger_at

2. pg_cron (a cada minuto)
   → Chama Edge Function send-reminders

3. Edge Function send-reminders
   → SELECT reminders WHERE next_trigger_at <= now() AND active = true
   → Para cada reminder:
     a. Verificar notification_preferences.reminders_enabled
     b. Verificar quiet_hours (quiet_hours_start / quiet_hours_end)
     c. Buscar push subscription do usuário
     d. Enviar notificação via Web Push ou FCM
     e. UPDATE reminders SET
          last_sent_at = now(),
          next_trigger_at = próxima_ocorrência
        WHERE id = reminder.id

4. Se quiet hours ativas:
   → Não envia, mas recalcula next_trigger_at para após quiet_hours_end
```

---

## Schema Adicional Necessário

### Tabela `push_subscriptions`

```sql
CREATE TABLE public.push_subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint    TEXT NOT NULL,
  p256dh      TEXT NOT NULL,
  auth_key    TEXT NOT NULL,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "push_subscriptions_own"
  ON public.push_subscriptions FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

### Coluna de Erro em `reminders`

```sql
ALTER TABLE public.reminders
  ADD COLUMN IF NOT EXISTS last_error TEXT,
  ADD COLUMN IF NOT EXISTS error_count INT NOT NULL DEFAULT 0;
```

Para rastrear falhas de envio e implementar retry/backoff.

---

## Cálculo de `next_trigger_at` por Recorrência

### `daily`

```
next = computeNextTriggerAt(time_local, timezone, last_sent_at + 1 minuto)
```

O algoritmo em `scheduling.ts` já lida com day rollover — se o horário já passou hoje, avança para amanhã.

### `weekdays` (seg–sex)

```
next = computeNextTriggerAt(time_local, timezone, from)
while (diaDaSemana(next) é sábado ou domingo):
  from = meia-noite do próximo dia local
  next = computeNextTriggerAt(time_local, timezone, from)
```

O dia da semana deve ser calculado no timezone local do usuário, não em UTC.

### `custom_future` (reservado)

Valor reservado para futura implementação de RRULE básico (ex: semanais, quinzenais). Não será implementado no MVP nem na próxima fase.

---

## Quiet Hours

A tabela `notification_preferences` já tem `quiet_hours_start` e `quiet_hours_end`. A lógica:

```
se now() (em timezone do usuário) está entre quiet_hours_start e quiet_hours_end:
  → adiar notificação para quiet_hours_end
  → atualizar next_trigger_at para amanhã em quiet_hours_end
```

Caso edge: quiet hours que cruzam meia-noite (ex: 22h → 06h). Tratar como: se hora atual > start OR hora atual < end → dentro do quiet period.

---

## Ordem de Implementação Recomendada

### Fase 8A — PWA Foundation
1. Configurar `next-pwa` ou manifest.json
2. Gerar VAPID keys (`web-push` npm package)
3. Service Worker básico (intercept fetch, cache estático)
4. Tela de opt-in de notificações no perfil

### Fase 8B — Push Subscription
1. Criar tabela `push_subscriptions`
2. Server Action para salvar subscription
3. Testar `Notification.permission` no client

### Fase 8C — Edge Function: send-reminders
1. Criar `supabase/functions/send-reminders/index.ts`
2. Integrar `web-push` dentro da Edge Function (Deno compatible)
3. Lógica de quiet hours
4. Teste local com `supabase functions serve`

### Fase 8D — pg_cron
1. Habilitar extensão no Supabase Dashboard
2. `SELECT cron.schedule('send-reminders', '* * * * *', 'SELECT net.http_post(...)')`
3. Monitorar `cron.job_run_details`

### Fase 8E — Observabilidade
1. Tabela `notification_log` para auditoria
2. Dashboard simples de sucessos/falhas
3. Alertas se error_count > threshold

---

## Considerações de Segurança

| Risco                              | Mitigação                                              |
|------------------------------------|--------------------------------------------------------|
| Edge Function acessada externamente | Secret header validado no handler                     |
| VAPID keys expostas                 | Supabase Vault para armazenar secrets                 |
| Notificações para outros usuários   | RLS em push_subscriptions + verificar user_id no código|
| Spam se cron duplicar execuções     | Check `last_sent_at > now() - 1 minuto` antes de enviar|
| Push subscription expirada          | Remover do banco em caso de 410 Gone da API do browser |

---

## Por Que Não Agora

O MVP foca em **registro e consciência** — o usuário configura lembretes e vê no app quando tomou ou não. A entrega por push adiciona:

1. Complexidade de Service Worker (state management fora do React)
2. Permissões de browser (UX sensível — pedir no momento errado destrói a taxa de opt-in)
3. Variações de comportamento cross-browser (Safari Push ainda tem quirks no iOS 16-)
4. Infraestrutura de cron no Supabase (requer pg_cron habilitado no projeto)
5. Edge Functions de Deno (stack diferente do Next.js/Node.js)

Esses investimentos fazem sentido quando o core loop de saúde estiver validado com usuários reais.

---

## Decisão: Sem Polling no Cliente

Alternativa descartada: polling `setInterval` no cliente para verificar `next_trigger_at`.

**Por quê descartado:**
- Consome bateria em mobile
- Não funciona com aba fechada ou app em background
- Inconsistente entre tabs abertas
- Adiciona complexidade de estado de sincronização
- Supabase cobra por request — polling é custo variável difícil de prever

O padrão correto para wellness apps é: notificação push server-side → usuário abre o app → sincronização via Server Component (revalidação automática).
