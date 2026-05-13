# Notificações Push — VivaLeve

## Visão geral

O sistema de notificações usa a Web Push API com VAPID para enviar lembretes de medicação diretamente ao dispositivo do usuário, sem depender de e-mail ou SMS.

```
Usuário ativa push no app
        │
        ▼
Browser pede permissão ao usuário
        │
        ▼
PushManager.subscribe() → PushSubscription
        │
        ▼
savePushSubscriptionAction → push_subscriptions (Supabase)
        │
        ▼
pg_cron (1x/min) → Edge Function send-reminders
        │
        ▼
Web Push Protocol (VAPID) → Push Service do navegador
        │
        ▼
Service Worker (/sw.js) recebe evento "push"
        │
        ▼
showNotification() → usuário vê o lembrete
```

---

## Componentes

| Arquivo | Responsabilidade |
|---|---|
| `src/lib/push.ts` | Utilitários client-side: isPushSupported, subscribeToPush, etc. |
| `src/features/notifications/hooks/usePushNotifications.ts` | Hook React com estados tipados |
| `src/features/notifications/components/PushToggle.tsx` | UI para ativar/desativar notificações |
| `src/features/notifications/components/NotificationPreferencesForm.tsx` | Formulário de preferências |
| `src/features/notifications/actions.ts` | Server Actions: save/remove subscription, save preferences |
| `public/sw.js` | Service Worker: recebe push, mostra notificação, handle click |
| `src/components/shared/ServiceWorkerRegistration.tsx` | Registra /sw.js no mount |
| `supabase/functions/send-reminders/index.ts` | Edge Function: entrega notificações |
| `supabase/functions/cleanup-subscriptions/index.ts` | Edge Function: remove subscriptions inativas |
| `supabase/functions/_shared/quiet-hours.ts` | Lógica de horário de silêncio |

---

## Configuração de produção

### 1. Gerar chaves VAPID

```bash
npx web-push generate-vapid-keys
```

Saída:
```
Public Key: Bxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Private Key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. Configurar variáveis

**No Next.js (Vercel):**
```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<Public Key>
```

**Nos segredos da Edge Function (Supabase → Edge Functions → Secrets):**
```
VAPID_PUBLIC_KEY=<Public Key>
VAPID_PRIVATE_KEY=<Private Key>
VAPID_SUBJECT=mailto:suporte@vivaleve.app
SUPABASE_URL=<URL do projeto>
SUPABASE_SERVICE_ROLE_KEY=<service_role key>
```

> **Segurança:** A Private Key NUNCA deve aparecer no código do app ou em variáveis de ambiente prefixadas com `NEXT_PUBLIC_`.

### 3. Deploy das Edge Functions

```bash
supabase functions deploy send-reminders
supabase functions deploy cleanup-subscriptions
```

### 4. Configurar pg_cron (scheduler)

No SQL Editor do Supabase:

```sql
-- Invocar send-reminders a cada minuto
select cron.schedule(
  'send-reminders',
  '* * * * *',
  $$
  select net.http_post(
    url := '<SUPABASE_URL>/functions/v1/send-reminders',
    headers := '{"Authorization": "Bearer <SUPABASE_ANON_KEY>"}'::jsonb
  )
  $$
);

-- Limpar subscriptions inativas uma vez por dia às 03:00 UTC
select cron.schedule(
  'cleanup-subscriptions',
  '0 3 * * *',
  $$
  select net.http_post(
    url := '<SUPABASE_URL>/functions/v1/cleanup-subscriptions',
    headers := '{"Authorization": "Bearer <SUPABASE_ANON_KEY>"}'::jsonb
  )
  $$
);
```

> **Pré-requisito:** pg_cron e pg_net devem estar habilitados em **Database → Extensions**.

---

## Banco de dados

### push_subscriptions

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → auth.users |
| `endpoint` | text UNIQUE | URL do push service do navegador |
| `p256dh_key` | text | Chave de criptografia (pública do browser) |
| `auth_key` | text | Segredo de autenticação |
| `user_agent` | text | Identificação do dispositivo |
| `active` | boolean | False após MAX_ERRORS falhas consecutivas |
| `error_count` | int | Contador de falhas de entrega |
| `last_error` | text | Última mensagem de erro |

### notification_preferences

| Coluna | Tipo | Descrição |
|---|---|---|
| `user_id` | uuid | PK + FK → auth.users |
| `reminders_enabled` | boolean | Se falso, nenhum push é enviado |
| `quiet_hours_start` | time | Início do horário de silêncio |
| `quiet_hours_end` | time | Fim do horário de silêncio |
| `timezone` | text | Timezone do usuário (snapshot) |

---

## Limitações conhecidas

### iOS Safari
- Notificações push só funcionam em PWAs **instaladas** (ícone na tela de início).
- Requer **iOS 16.4+**.
- Em aba normal do Safari (mesmo no iPhone): **não funciona**.
- Instrução ao usuário: "Toque em Compartilhar → Adicionar à Tela de Início".

### Firefox / Chrome Android
- Suporte completo, inclusive em aba normal do navegador.

### Chrome Desktop / Edge
- Suporte completo.

### Safari macOS
- Suporte em PWAs instaladas (macOS 13 Ventura+, Safari 16+).

---

## Fluxo de erro e recuperação

1. Push falha → `error_count` incrementa em `push_subscriptions`
2. Após `MAX_ERRORS` (5) falhas consecutivas → `active = false`
3. `cleanup-subscriptions` remove subscriptions inativas diariamente
4. Se o usuário desativar e reativar notificações, uma nova subscription é criada
5. Push bem-sucedido após falhas → `error_count` zerado automaticamente

---

## Horário de silêncio

- Configurado pelo usuário em **Perfil → Notificações → Horário de silêncio**
- Suporta intervalos que cruzam a meia-noite (ex.: 22:00 – 07:00)
- Calculado no timezone do usuário, não em UTC
- Durante o silêncio: `next_trigger_at` é avançado sem enviar push
