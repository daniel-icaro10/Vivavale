# RLS STRATEGY — VivaLeve
> **Status:** Oficial. Define o modelo de segurança do banco de dados.
> **Última revisão:** 2026-05-13
> **Escopo:** Todas as tabelas públicas, todas as policies, defense in depth.

---

## 1. Filosofia

### Owner-Only Data Model

Todo dado de usuário no VivaLeve pertence exclusivamente ao usuário que o criou. Não existe tabela compartilhada entre usuários no MVP. Cada query retorna apenas dados onde `user_id = auth.uid()`.

**Consequência:** RLS pode ser implementado com uma regra simples e uniforme para todas as tabelas:

```sql
USING (auth.uid() = user_id)
```

Sem exceções, sem roles adicionais, sem compartilhamento entre usuários no MVP.

### RLS como Segunda Linha de Defesa

O RLS não é a única proteção. É a segunda linha:

```
Linha 1 — Server Action:
  supabase.auth.getUser()
  .eq("user_id", user.id) em toda query de write
  
Linha 2 — PostgreSQL RLS:
  auth.uid() = user_id verificado pelo banco
```

Se a Server Action tiver um bug de autorização, o RLS ainda bloqueia o acesso. Se o RLS estiver mal configurado (improvável), a Server Action ainda rejeita. As duas camadas falham independentemente.

---

## 2. Configuração por Tabela

### `profiles`

```sql
-- SELECT: usuário vê apenas seu próprio perfil
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- UPDATE: usuário atualiza apenas seu próprio perfil
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
```

**Sem INSERT policy:** O INSERT em `profiles` é feito exclusivamente pelo trigger `handle_new_user` com `SECURITY DEFINER`. O trigger executa como o role dono da função, bypassing RLS. Um usuário autenticado que tente fazer INSERT direto em `profiles` é bloqueado pelo RLS (sem policy = deny).

**Sem DELETE policy:** Usuários não podem deletar o próprio perfil via API. Deleção de usuário ocorre via Supabase Auth Admin API, que cascade-deleta o perfil automaticamente.

### `daily_logs`

```sql
CREATE POLICY "daily_logs_select_own" ON public.daily_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "daily_logs_insert_own" ON public.daily_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "daily_logs_update_own" ON public.daily_logs
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Sem DELETE policy (removida na migration 002)
```

**Sem DELETE policy:** `daily_logs` usa UPSERT como fluxo principal. Não existe caso de uso legítimo para o usuário deletar um log diário via interface. Manter a policy seria exposição desnecessária. Sem a policy, DELETE é bloqueado por padrão (RLS habilitado + sem policy permitindo = deny all).

### `medications`

```sql
CREATE POLICY "medications_select_own" ON public.medications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "medications_insert_own" ON public.medications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "medications_update_own" ON public.medications
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "medications_delete_own" ON public.medications
  FOR DELETE USING (auth.uid() = user_id);
```

**Com DELETE policy:** Usuários podem deletar medicamentos. O cascade `ON DELETE CASCADE` para `reminders` remove automaticamente os lembretes associados.

### `reminders`

```sql
CREATE POLICY "reminders_select_own" ON public.reminders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "reminders_insert_own" ON public.reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reminders_update_own" ON public.reminders
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reminders_delete_own" ON public.reminders
  FOR DELETE USING (auth.uid() = user_id);
```

### `notification_preferences`

```sql
CREATE POLICY "notif_prefs_select_own" ON public.notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notif_prefs_insert_own" ON public.notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notif_prefs_update_own" ON public.notification_preferences
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Sem DELETE policy — tabela 1:1, nunca deletada independentemente
```

**Sem DELETE policy:** `notification_preferences` é uma tabela 1:1 com o usuário. É criada lazily (upsert no primeiro acesso). Nunca deletada diretamente — cascade da deleção do usuário via `auth.users`.

---

## 3. Tabela de Políticas

| Tabela | SELECT | INSERT | UPDATE | DELETE | Observação |
|---|---|---|---|---|---|
| `profiles` | ✓ | — | ✓ | — | INSERT via trigger SECURITY DEFINER |
| `daily_logs` | ✓ | ✓ | ✓ | — | DELETE removida intencionalmente |
| `medications` | ✓ | ✓ | ✓ | ✓ | Cascade para reminders |
| `reminders` | ✓ | ✓ | ✓ | ✓ | |
| `notification_preferences` | ✓ | ✓ | ✓ | — | Tabela 1:1, delete via cascade |

---

## 4. USING vs. WITH CHECK

Todas as policies de UPDATE usam ambas as cláusulas:

```sql
CREATE POLICY "tabela_update_own" ON public.tabela
  FOR UPDATE
  USING  (auth.uid() = user_id)  -- filtra linhas visíveis para UPDATE
  WITH CHECK (auth.uid() = user_id);  -- valida o resultado após UPDATE
```

**Por que ambas:**
- `USING`: determina quais linhas o usuário pode tentar atualizar (filtro de seleção)
- `WITH CHECK`: valida o estado resultante após a atualização (proteção contra mudança de `user_id`)

Sem `WITH CHECK`, um usuário poderia em teoria fazer `UPDATE ... SET user_id = outro_id` — o `USING` bloquearia o acesso à linha, mas `WITH CHECK` garante que mesmo que o `USING` seja bypassado, o resultado não pode ter um `user_id` diferente.

---

## 5. CASCADE DELETE e RLS

FK cascade delete (`medications → reminders`) executa **como o role dono da tabela**, não como o usuário autenticado. Isso significa:

- Quando um usuário deleta um medication via Server Action, o RLS da policy `medications_delete_own` verifica `auth.uid() = user_id` ✓
- O cascade delete dos reminders associados **não verifica** `reminders_delete_own` — executa diretamente pelo PostgreSQL
- Este é o comportamento correto e seguro: o PostgreSQL garante que apenas os reminders do medication deletado são removidos via integridade referencial

```
Usuário deleta medication A (ownership verificado por RLS + Server Action)
  → PostgreSQL cascade: DELETE FROM reminders WHERE medication_id = A.id
     (executa como postgres role, bypassa RLS — mas é seguro porque a FK garante integridade)
```

---

## 6. auth.uid() — Disponibilidade e Comportamento

`auth.uid()` é uma função disponível nativamente no Supabase via extensão `auth`. Retorna o UUID do usuário autenticado na sessão atual.

**Em Server Actions com SSR client:**
- O Supabase SSR client (`createServerClient`) opera com a sessão do usuário
- `auth.uid()` reflete o usuário autenticado no cookie de sessão
- Se a sessão expirou, `auth.uid()` retorna `NULL` → todas as policies retornam `false` → todas as queries retornam vazio

**Comportamento quando não autenticado:**
```sql
-- auth.uid() retorna NULL quando não autenticado
-- NULL = user_id nunca passa: NULL != 'qualquer-uuid'
USING (auth.uid() = user_id)  -- retorna FALSE para NULL uid
```

---

## 7. Client do Servidor vs. service_role

### SSR Client (uso atual)

```typescript
import { createServerClient } from "@/lib/supabase/server";
const supabase = await createServerClient();
```

- Opera com a sessão do usuário (cookies)
- RLS **sempre aplicado** — o usuário só acessa seus próprios dados
- Qualquer bug de autorização na Server Action ainda é protegido pelo RLS

### service_role (uso futuro — Edge Functions)

O service_role key **bypassa todo o RLS**. Deve ser usado exclusivamente em:
- Supabase Edge Functions no servidor (Deno)
- Operações administrativas que precisam acessar dados de múltiplos usuários (ex: cron de envio de notificações)

**Nunca expor o service_role key no cliente.** Nunca usar em Server Actions Next.js.

```typescript
// ✅ CORRETO — apenas em Edge Functions
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ❌ NUNCA — em Server Actions ou código acessível pelo cliente
const supabase = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY);
```

---

## 8. Validação de Ownership nas Server Actions

Além do RLS, as Server Actions validam ownership explicitamente:

### Pattern padrão de read + write

```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user) return { error: "Sessão expirada." };

// Write — .eq("user_id", user.id) é redundante com RLS mas intencional
const { error } = await supabase
  .from("reminders")
  .update(payload)
  .eq("id", id)
  .eq("user_id", user.id);  // ← defesa explícita
```

O `.eq("user_id", user.id)` garante que mesmo se o RLS estiver temporariamente desabilitado (ex: durante debugging ou configuração incorreta), a query ainda não afeta dados de outros usuários.

### assertMedicationOwnership

Para reminders, verificação adicional de que `medication_id` pertence ao usuário:

```typescript
async function assertMedicationOwnership(
  medicationId: string,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("medications")
    .select("id")
    .eq("id", medicationId)
    .eq("user_id", userId)
    .single();
  return data !== null;
}
```

Previne que um usuário crie um reminder referenciando `medication_id` de outro usuário. O RLS do INSERT em `reminders` verificaria `user_id = auth.uid()`, mas não verificaria se o `medication_id` pertence ao mesmo usuário — esse gap é coberto pela verificação explícita.

---

## 9. Riscos Conhecidos e Mitigações

### Data leak via timing attacks

**Risco:** Mesmo com RLS, queries que demoram diferentemente para dados existentes vs. inexistentes podem vazar informação de existência (ex: "existe usuário com este email?").

**Mitigação atual:** Não aplicável ao MVP — todas as queries são owner-only, não há consultas cross-user.

### RLS bypass via SECURITY DEFINER

**Risco:** Funções marcadas com `SECURITY DEFINER` executam como o role dono, bypassing RLS.

**Funções SECURITY DEFINER no projeto:**
- `handle_new_user()`: apenas faz INSERT em `profiles` para o `NEW.id` do trigger. Não lê nem modifica dados de outros usuários.

**Proteção adicional:** `SET search_path = public` previne search_path injection em funções SECURITY DEFINER.

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public  -- ← proteção obrigatória
AS $$ ... $$;
```

### Sessão expirada silenciosa

**Risco:** Se a sessão do usuário expirar entre o `getUser()` e a query, o RLS retornará vazio sem erro explícito.

**Mitigação:** Server Actions sempre verificam `if (userError || !user) return { error: "..." }` antes de qualquer query de write.

---

## 10. Anti-patterns Proibidos

```typescript
// ❌ PROIBIDO: query sem verificar autenticação
export async function getReminders() {
  const supabase = await createServerClient();
  return supabase.from("reminders").select("*"); // sem .eq("user_id")!
}

// ❌ PROIBIDO: confiar apenas no RLS sem verificação na action
export async function deleteReminder(id: string) {
  // Sem getUser() — confia apenas no RLS
  const supabase = await createServerClient();
  await supabase.from("reminders").delete().eq("id", id);
}

// ❌ PROIBIDO: usar service_role em Server Action
const supabase = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY);

// ❌ PROIBIDO: receber user_id do cliente
export async function createLog(userId: string, data: ...) {
  // user_id deve vir de supabase.auth.getUser(), nunca do parâmetro
  await supabase.from("daily_logs").insert({ user_id: userId, ... });
}
```

```typescript
// ✅ CORRETO: verificação dupla
export async function deleteReminder(id: string) {
  const supabase = await createServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { error: "Sessão expirada." };
  
  await supabase
    .from("reminders")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);  // ← explícito + RLS como fallback
}
```
