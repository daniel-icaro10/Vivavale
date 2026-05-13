# ARCHITECTURE OVERVIEW — VivaLeve
> **Status:** Oficial. Visão macro do sistema para referência de desenvolvimento.
> **Última revisão:** 2026-05-13
> **Escopo:** Stack completa, camadas, fluxo de dados, princípios e roadmap técnico.

---

## 1. Identidade do Projeto

**VivaLeve** é um aplicativo de acompanhamento de saúde para pessoas com fibromialgia. O foco do MVP é registro de sintomas, gestão de medicamentos e lembretes de medicação.

**Público-alvo:** adultos brasileiros com fibromialgia, frequentemente com fadiga cognitiva como sintoma. A UX prioriza clareza, baixo esforço e acessibilidade.

**Modelo de dados:** owner-only. Não existe dado compartilhado entre usuários no MVP. Cada usuário acessa exclusivamente seus próprios registros.

---

## 2. Stack Tecnológica

### Frontend / App

| Tecnologia | Versão | Função |
|---|---|---|
| Next.js App Router | atual | Framework principal, SSR, Server Components, Server Actions |
| React | (bundled com Next.js) | Componentes de UI |
| TypeScript | strict mode | Tipo estático em todo o projeto |
| Tailwind CSS v4 | v4.x | Estilização com sistema de cores oklch |

### Banco de Dados / Backend

| Tecnologia | Versão | Função |
|---|---|---|
| Supabase | cloud | Plataforma: banco, auth, RLS, storage, Edge Functions |
| PostgreSQL | 15+ | Banco de dados relacional |
| Supabase Auth | — | Autenticação de usuários |
| `@supabase/ssr` | 0.10.3 | Client SSR para Next.js |
| `@supabase/supabase-js` | 2.105.4 | Client JavaScript |

### Validação e Formulários

| Tecnologia | Versão | Função |
|---|---|---|
| Zod | v4.x | Validação de schemas e inferência de tipos |
| React Hook Form | v7.75.0 | Gerenciamento de formulários |
| `@hookform/resolvers/zod` | — | Bridge Zod ↔ React Hook Form |

---

## 3. Diagrama de Camadas

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTE (Browser)                       │
│                                                                 │
│  React Client Components                                        │
│  ├── Formulários (React Hook Form + Zod)                        │
│  ├── Estados locais de UI (useState — sem estado global)        │
│  └── Calls para Server Actions (não para Supabase diretamente)  │
└───────────────────────────┬─────────────────────────────────────┘
                            │ Server Actions (RPC via Next.js)
┌───────────────────────────▼─────────────────────────────────────┐
│                    SERVIDOR (Next.js)                           │
│                                                                 │
│  Server Components                                              │
│  ├── Fetch de dados (Supabase SSR client)                       │
│  ├── Render inicial com dados reais                             │
│  └── Sem estado — re-renderiza após refresh()                   │
│                                                                 │
│  Server Actions                                                 │
│  ├── Validação Zod                                              │
│  ├── Autenticação via getUser()                                 │
│  ├── Verificação de ownership                                   │
│  ├── Operações de banco (INSERT/UPDATE/DELETE)                  │
│  └── refresh() para revalidar Server Components                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │ Supabase SSR client (com cookies de sessão)
┌───────────────────────────▼─────────────────────────────────────┐
│                    SUPABASE (Cloud)                             │
│                                                                 │
│  Auth           — sessões, JWT, triggers de new user            │
│  PostgreSQL 15+ — dados, RLS, índices, triggers, constraints    │
│  Edge Functions — (Phase 8) envio de notificações              │
│  pg_cron        — (Phase 8) agendamento de jobs                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Tabelas do Banco de Dados

### Mapa de tabelas

```
auth.users  (Supabase Auth — gerenciado automaticamente)
  │
  ├── 1:1  public.profiles
  │         └── id, name, age, diagnosis, timezone
  │
  ├── 1:N  public.daily_logs
  │         └── user_id, date, pain_level, fatigue_level,
  │             sleep_quality, mood_level, anxiety_level, notes
  │         └── UNIQUE(user_id, date)
  │
  ├── 1:N  public.medications
  │         └── user_id, name, dosage, frequency, start_date,
  │             active, notes
  │         │
  │         └── 1:N  public.reminders
  │                   └── user_id, medication_id, time_local, timezone,
  │                       recurrence, active, last_sent_at, next_trigger_at
  │
  └── 1:1  public.notification_preferences
            └── user_id, reminders_enabled, quiet_hours_start,
                quiet_hours_end, timezone
```

### Cardinalidade

| Relação | Cardinalidade | ON DELETE |
|---|---|---|
| auth.users → profiles | 1:1 | CASCADE |
| auth.users → daily_logs | 1:N | CASCADE |
| auth.users → medications | 1:N | CASCADE |
| auth.users → notification_preferences | 1:1 | CASCADE |
| medications → reminders | 1:N | CASCADE |

---

## 5. Fluxo de Dados

### Leitura (Server Component)

```
Browser request
  → Next.js Server Component
  → createServerClient() com cookies da sessão
  → supabase.auth.getUser() [implícito via SSR]
  → supabase.from("tabela").select(...).eq("user_id", user.id)
  → RLS verifica auth.uid() = user_id no banco
  → dados retornados → render HTML → enviado ao browser
```

### Escrita (Server Action)

```
Usuário submete formulário
  → React Client Component chama Server Action
  → Server Action:
      1. schema.safeParse(data)         — validação Zod
      2. supabase.auth.getUser()        — autenticação
      3. ownership checks               — defesa em profundidade
      4. supabase.from(...).insert/update/delete — operação
      5. RLS verifica auth.uid() = user_id
      6. refresh()                      — invalida cache
      7. return { success: true } | { error: "..." }
  → Client Component atualiza estado de UI
  → Server Component re-renderiza com dados atualizados
```

---

## 6. Autenticação

**Provedor:** Supabase Auth.

**Fluxo:** Email/senha (MVP). OAuth pode ser adicionado via Dashboard sem mudanças de schema.

**Sessão:** gerenciada via cookies SSR pelo `@supabase/ssr`. O middleware Next.js renova tokens automaticamente.

**user_id:** o UUID do usuário (`auth.users.id`) é a chave primária de todos os dados. Extraído via `supabase.auth.getUser()` no servidor — nunca aceito como parâmetro do cliente.

**Criação de perfil:** trigger `on_auth_user_created` cria automaticamente um registro em `profiles` ao registrar novo usuário. SECURITY DEFINER bypassa RLS para o INSERT inicial.

---

## 7. Estratégia de Cache e Revalidação

**Server Components** são cacheados pelo Next.js App Router.

**Invalidação:** `refresh()` (importado de `next/cache`) invalida o cache da rota atual após toda mutation bem-sucedida. O Server Component re-executa e busca dados atualizados.

```typescript
import { refresh } from "next/cache";
// Após mutation:
refresh();
return { success: true };
```

**Não usado:** `revalidatePath`, `revalidateTag`, React Query, SWR, contextos de estado global, Zustand, Redux.

---

## 8. Responsabilidades por Camada

### Server Components

- Buscar dados do Supabase (reads)
- Calcular `today` e outras propriedades baseadas no contexto
- Compor a página passando dados para Client Components
- NÃO processar mutations, NÃO ter lógica de negócio

### Client Components

- Gerenciar estado local de UI (formulários, fases de delete/toggle)
- Chamar Server Actions em resposta a interações do usuário
- Exibir feedback visual (loading, erro, sucesso)
- NÃO chamar Supabase diretamente, NÃO manter estado global

### Server Actions

- Toda lógica de mutation (create, update, delete, toggle)
- Validação Zod do input
- Extração de `user_id` do servidor
- Verificação de ownership
- Operações de banco com RLS
- Revalidação de cache

### Banco (PostgreSQL + RLS)

- Persistência de dados
- Segunda linha de defesa via RLS
- Integridade referencial via FK + CASCADE
- `updated_at` via trigger
- Criação de profile via trigger `handle_new_user`
- Validação de ranges via CHECK constraints

---

## 9. Princípios de Design

### Sem estado global

Não existe Context API, Zustand, Redux, Jotai ou qualquer gerenciador de estado global. O estado da aplicação vive em:
- Server Components (dados do banco, re-renderizados por `refresh()`)
- `useState` local em Client Components (estado de UI temporário)

**Razão:** estado global cria acoplamento implícito difícil de rastrear. Server Components + Server Actions + `refresh()` oferecem o mesmo resultado final com rastreabilidade explícita.

### Mobile-first

- Alvos de toque mínimos de 44×44px em todos os elementos interativos
- Espaçamento generoso entre elementos clicáveis
- Sem hover-only interactions
- Formulários com campos grandes e labels explícitos
- Cartas com ações sempre visíveis (sem menus ocultos)

### Baixa carga cognitiva

O público tem fadiga mental como sintoma. Princípios de UX:
- Uma ação por tela sempre que possível
- Confirmação de delete sem modais — confirmação inline na mesma card
- Feedback imediato mas sem barulho visual
- Linguagem simples, em português coloquial, sem jargão médico
- Sem notificações não solicitadas no MVP

### Acessibilidade como requisito

- `role="alert"` + `aria-live="polite"` para feedback de erros e sucesso
- Labels explícitos para todos os inputs (sem placeholder como único label)
- Semântica HTML correta (`<article>`, `<label>`, `<button type>`)
- Navegação por teclado funcional
- Screen reader friendly via `aria-label` em elementos com ícone-only

---

## 10. Decisões Arquiteturais Definitivas

| Decisão | Escolha | Razão |
|---|---|---|
| Estado global | ❌ Nenhum | Server Components eliminam a necessidade |
| Mutations | Server Actions exclusivamente | `user_id` vem do servidor |
| Validação | Zod (client + server) | Schema único, inferência de tipos |
| Timezone | Intl API nativa | Zero dependência, adequado para o escopo |
| Enums no banco | CHECK IN (não ENUM type) | ALTER TYPE tem restrições transacionais |
| Soft delete | ❌ Hard delete (active = soft inactive) | Simplicidade > auditabilidade no MVP |
| Optimistic updates | ❌ Não | Evita complexidade de reconciliação |
| Polling / WebSocket | ❌ Não no MVP | Sem real-time necessity |
| Push notifications | ❌ Não no MVP | Complexidade de Service Worker adiada |
| IDs | UUID via gen_random_uuid() | Sem exposição de contagem, sem sequências |
| Timestamps | timestamptz UTC | Padrão universal e sem ambiguidade |
| Datas locais | Enviadas pelo cliente | Servidor não conhece timezone do usuário |

---

## 11. Estrutura de Diretórios

```
src/
├── app/
│   └── (app)/                    — rotas autenticadas
│       ├── layout.tsx            — layout com navegação
│       ├── dashboard/            — visão geral
│       ├── daily/                — registro diário
│       ├── history/              — histórico de registros
│       ├── medications/          — gestão de medicamentos
│       │   ├── page.tsx          — Server Component
│       │   └── loading.tsx       — Skeleton UI
│       ├── reminders/            — gestão de lembretes
│       │   ├── page.tsx          — Server Component
│       │   └── loading.tsx       — Skeleton UI
│       └── profile/              — perfil do usuário
│
├── components/
│   ├── shared/layout/            — PageHeader, navegação compartilhada
│   └── ui/                       — componentes base (Button, Input, etc.)
│
├── features/
│   ├── medications/              — feature de medicamentos
│   │   ├── actions.ts            — Server Actions
│   │   ├── schemas.ts            — Zod schemas
│   │   ├── constants.ts          — limites, opções
│   │   └── components/           — MedicationCard, MedicationForm, etc.
│   │
│   └── reminders/                — feature de lembretes
│       ├── actions.ts            — Server Actions
│       ├── schemas.ts            — Zod schemas
│       ├── constants.ts          — RECURRENCE_OPTIONS, DEFAULT_TIMEZONE
│       ├── types.ts              — ReminderSaveStatus, etc.
│       ├── utils/
│       │   └── scheduling.ts     — computeNextTriggerAt, normalizeTimeLocal
│       └── components/           — ReminderCard, ReminderForm, etc.
│
├── lib/
│   └── supabase/
│       └── server.ts             — createServerClient
│
└── types/
    ├── database.ts               — Database type (schema do banco)
    └── app.ts                    — tipos de domínio (re-exports + compostos)

docs/                             — documentação arquitetural oficial
supabase/
└── migrations/                   — migrations SQL sequenciais
```

---

## 12. Roadmap Técnico

### Phase 7 — Reminder Foundation (concluído)

- Schema de reminders e notification_preferences
- Server Actions CRUD + toggle
- UI completa (card, form, list, empty state)
- Cálculo timezone-safe de `next_trigger_at`
- RLS e índices

### Phase 8 — Notification Delivery (futuro)

Pré-requisitos antes de iniciar:
1. Corrigir `computeNextTriggerAt` para considerar `recurrence = "weekdays"`
2. Adicionar UI de timezone no perfil do usuário

Componentes a implementar:
- Configuração de PWA (manifest, service worker)
- Permissão de push notification (UX de opt-in)
- Tabela `push_subscriptions`
- Edge Function `send-reminders`
- pg_cron para trigger periódico
- Constraint `quiet_hours_consistent` em `notification_preferences`
- Campos `error_count` e `last_error` em `reminders`

### Após Phase 8 (backlog)

| Feature | Dependência de schema |
|---|---|
| Adherence tracking (tomei / não tomei) | Nova tabela ou campo em reminders |
| Symptom insights / correlações | Read-only sobre daily_logs |
| Compartilhamento com médico | Nova tabela: shares, permissões temporárias |
| Export PDF | Read-only, sem schema novo |
| Clinician portal | Schema de multi-user com roles |

---

## 13. Compatibilidade Supabase

| Feature | Status |
|---|---|
| PostgreSQL 15+ | ✓ Supabase usa 15+ |
| `gen_random_uuid()` | ✓ Nativo em PostgreSQL 13+ |
| `timestamptz` | ✓ UTC via Supabase client |
| RLS com `auth.uid()` | ✓ Nativo no Supabase |
| `CREATE OR REPLACE TRIGGER` | ✓ PostgreSQL 14+ |
| Partial indexes | ✓ Suportado |
| Edge Functions (Deno) | ✓ Disponível, não usado no MVP |
| pg_cron | ✓ Disponível via extensão, não usado no MVP |
| Supabase Storage | ✓ Disponível, não usado no MVP |
| Supabase Realtime | ✓ Disponível, não usado no MVP |
