# Plano de Observabilidade — VivaLeve

## Estado atual

O app possui logging centralizado via `src/lib/logger.ts`.  
O logger escreve JSON estruturado no console (stdout) e está preparado para integração futura com um SDK externo sem alterar os call sites.

---

## Eventos críticos a monitorar

### Auth
| Evento | Nível | Onde instrumentar |
|---|---|---|
| Login falhou (credenciais inválidas) | warn | `loginAction` — já retorna erro mapeado |
| Registro falhou | warn | `registerAction` |
| Token de recuperação expirado | warn | callback route — `exchangeCodeForSession` falha |
| Sessão expirada durante ação | error | qualquer Server Action com `getUser()` retornando erro |
| Logout | info | `logoutAction` |

### Dados
| Evento | Nível | Onde instrumentar |
|---|---|---|
| Falha ao salvar registro diário | error | `saveDailyLogAction` |
| Falha ao criar/atualizar medicamento | error | `medications/actions.ts` |
| Falha ao criar/atualizar lembrete | error | `reminders/actions.ts` |
| Tentativa de acessar medicamento de outro usuário | warn | `assertMedicationOwnership` |
| Falha ao atualizar perfil | error | `updateProfileAction` |

### Runtime
| Evento | Nível | Onde instrumentar |
|---|---|---|
| Erro crítico de renderização | error | `global-error.tsx` — já instrumentado |
| Erro de segmento de rota | error | `(app)/error.tsx` — já instrumentado |
| Env var ausente na inicialização | error | `src/lib/env.ts` — lança exceção (fail-fast) |

---

## Métricas futuras (fase pós-MVP)

- Taxa de erro por Server Action
- Tempo de resposta das queries Supabase
- Taxa de conclusão do onboarding (usuário com medication + log + reminder)
- Retenção: % usuários que registram ≥3 dias/semana
- Churn precoce: usuários que não voltam após o primeiro registro

---

## Estratégia de error capture (integração futura)

### Opção recomendada: Sentry

Custo: free tier generoso para projetos pequenos.

**Integração no logger:**

```typescript
// src/lib/logger.ts — extensão futura
import * as Sentry from "@sentry/nextjs";

function log(level: LogLevel, message: string, context?: LogContext) {
  // ... console output já existente ...

  if (level === "error") {
    Sentry.captureMessage(message, { level: "error", extra: context });
  }
}
```

**Inicialização Sentry:**
- `sentry.client.config.ts` — inicializa no browser
- `sentry.server.config.ts` — inicializa no servidor
- `sentry.edge.config.ts` — opcional para edge runtime

**Env vars necessárias:**
- `NEXT_PUBLIC_SENTRY_DSN` — identificador do projeto

### Alternativa: Axiom / Logtail / Datadog

Todos suportam ingestão de logs JSON via HTTP. O logger atual já gera JSON estruturado — basta adicionar um `fetch()` ou usar o SDK correspondente no método `log()`.

---

## Analytics futura

**Eventos de produto a rastrear:**
1. `onboarding_completed` — quando user tem medication + log + reminder
2. `daily_log_saved` — registro diário salvo (inclui dia da semana)
3. `medication_added` — primeiro medicamento adicionado
4. `reminder_created` — primeiro lembrete criado
5. `profile_timezone_changed` — user aceitou sugestão de timezone

**Implementação recomendada:** Posthog (open source, self-hostable, free tier).  
Adicionar via `<PostHogProvider>` no `layout.tsx` ou via `usePostHog()` nos form submit handlers.

---

## Pontos de instrumentação prioritários (quando escalar)

1. `src/app/auth/callback/route.ts` — logar falhas de `exchangeCodeForSession`
2. `src/features/reminders/actions.ts` — logar `assertMedicationOwnership` false
3. `src/features/auth/actions.ts` — logar auth errors por categoria
4. `src/lib/supabase/server.ts` — logar queries lentas (> 2s)

---

## Retenção de dados

- Logs de console (Vercel): 1 hora em free tier, 3 dias em Pro
- Sentry: 30 dias de retenção no free tier
- Supabase logs: 1 dia em free tier, 7 dias em Pro

**Recomendação:** subir para Vercel Pro ou usar Axiom (free tier generoso) quando o volume de usuários crescer.
