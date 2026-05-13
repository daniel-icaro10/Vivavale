# SERVER ACTIONS PATTERN — VivaLeve
> **Status:** Oficial. Template e padrões obrigatórios para todas as Server Actions.
> **Última revisão:** 2026-05-13
> **Escopo:** Todas as mutations (create, update, delete, toggle) no projeto.

---

## 1. Filosofia

### Server Actions como único ponto de escrita

O cliente Next.js **nunca** faz chamadas diretas ao Supabase para mutations. Todo `INSERT`, `UPDATE`, e `DELETE` passa obrigatoriamente por Server Actions.

**Razões:**
1. `user_id` extraído do servidor via `supabase.auth.getUser()` — nunca do corpo da requisição
2. Validação Zod centralizada antes de qualquer acesso ao banco
3. RLS + verificação explícita em um único lugar auditável
4. Revalidação de cache controlada (`refresh()`)
5. Sem exposição de queries SQL para o cliente

### Sem optimistic updates

O projeto não usa optimistic updates. O fluxo é:
```
Server Action executa → retorna resultado → UI reage ao resultado
```

Não há estado local que antecipa o resultado antes da confirmação do servidor. A UI mostra estados de loading (botão desabilitado, "Salvando...") enquanto aguarda.

---

## 2. Template Oficial

```typescript
"use server";

import { refresh } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { schema, type FormData } from "./schemas";

type ErrorResult = { error: string };
type SuccessResult = { success: true };

export async function createEntityAction(
  data: FormData,
): Promise<ErrorResult | SuccessResult> {
  // ────────────────────────────────────────────────────────
  // PASSO 1: Validar input com Zod
  // Qualquer dado vindo do cliente é não-confiável.
  // O schema valida tipos, formatos e limites.
  // ────────────────────────────────────────────────────────
  const parsed = schema.safeParse(data);
  if (!parsed.success) return { error: "Dados inválidos." };

  // ────────────────────────────────────────────────────────
  // PASSO 2: Autenticar — user_id vem do servidor
  // Nunca aceitar user_id como parâmetro da função.
  // ────────────────────────────────────────────────────────
  const supabase = await createServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  // ────────────────────────────────────────────────────────
  // PASSO 3 (quando necessário): Verificar ownership de recursos relacionados
  // Ex: medication_id pertence ao user antes de criar reminder
  // ────────────────────────────────────────────────────────
  // const owns = await assertRelatedOwnership(parsed.data.related_id, user.id);
  // if (!owns) return { error: "Recurso não encontrado." };

  // ────────────────────────────────────────────────────────
  // PASSO 4: Executar a operação no banco
  // .eq("user_id", user.id) é explícito além do RLS.
  // ────────────────────────────────────────────────────────
  try {
    const { error } = await supabase.from("entity").insert({
      user_id: user.id,
      ...parsed.data,
    });

    if (error) return { error: "Não foi possível salvar. Tente novamente." };
  } catch {
    return { error: "Não foi possível salvar. Tente novamente." };
  }

  // ────────────────────────────────────────────────────────
  // PASSO 5: Invalidar cache para que Server Components recarreguem
  // ────────────────────────────────────────────────────────
  refresh();
  return { success: true };
}
```

---

## 3. Tipos de Retorno

Todas as Server Actions retornam um tipo discriminado:

```typescript
type ErrorResult  = { error: string };
type SuccessResult = { success: true };

// Usage no componente cliente:
const result = await createEntityAction(data);
if ("error" in result) {
  setSaveStatus("error");
  setErrorMessage(result.error);
} else {
  setSaveStatus("success");
}
```

**Regras:**
- `error` é sempre uma string legível pelo usuário (em pt-BR)
- `success` é sempre `true` — o shape importa, não o valor
- Nunca retornar dados adicionais em `SuccessResult` — o Server Component recarrega automaticamente após `refresh()`
- Nunca lançar exceções não capturadas — o `try/catch` envolve toda operação de banco

---

## 4. Mensagens de Erro

### Mensagens para o usuário (retornadas como `{ error }`)

| Situação | Mensagem |
|---|---|
| Sessão expirada / não autenticado | `"Sessão expirada. Faça login novamente."` |
| Validação Zod falhou | `"Dados inválidos."` |
| Recurso relacionado não encontrado / sem ownership | `"Medicamento não encontrado."` (específico) |
| Erro de banco genérico | `"Não foi possível salvar. Tente novamente."` |
| Erro de banco em update | `"Não foi possível atualizar. Tente novamente."` |
| Erro de banco em delete | `"Não foi possível remover. Tente novamente."` |

**Regras:**
- Mensagens genéricas para erros de banco — não expor detalhes do schema ao cliente
- Mensagens específicas apenas quando o contexto é claro e sem risco de segurança
- Sempre em pt-BR
- Sempre terminando com instrução de ação quando aplicável ("Tente novamente.", "Faça login novamente.")

---

## 5. Padrão de Validação Zod

```typescript
// Sempre usar safeParse (nunca parse que lança exceção)
const parsed = schema.safeParse(data);
if (!parsed.success) return { error: "Dados inválidos." };

// Usar parsed.data (tipado) para todas as operações subsequentes
const { name, active, medication_id } = parsed.data;
```

**Por que `safeParse` em vez de `parse`:**
- `parse` lança `ZodError` que deve ser capturado — mais verboso
- `safeParse` retorna `{ success, data | error }` — padrão mais limpo para Server Actions
- O `error: "Dados inválidos."` genérico é suficiente — a validação real ocorre no frontend via `react-hook-form`

---

## 6. Padrão de Autenticação

```typescript
const supabase = await createServerClient();
const {
  data: { user },
  error: userError,
} = await supabase.auth.getUser();

if (userError || !user) {
  return { error: "Sessão expirada. Faça login novamente." };
}
```

**Regras:**
- Sempre `getUser()`, nunca `getSession()` para verificação de autenticação em Server Actions
- `getSession()` usa dados do cookie sem verificar com o servidor de auth — pode estar stale
- `getUser()` verifica o token com o Supabase Auth server — é a fonte de verdade
- `user.id` é o `UUID` seguro para usar como `user_id` nas queries

---

## 7. Padrão de Ownership em Writes

```typescript
// CORRETO — .eq("user_id", user.id) torna o update user-scoped
const { error } = await supabase
  .from("reminders")
  .update(payload)
  .eq("id", id)
  .eq("user_id", user.id);  // ← explícito além do RLS

// INCORRETO — confiar apenas no RLS
const { error } = await supabase
  .from("reminders")
  .update(payload)
  .eq("id", id);  // ← sem garantia explícita
```

O `.eq("user_id", user.id)` é redundante dado o RLS, mas é defesa em profundidade. Se o RLS estiver mal configurado (ex: policy não aplicada, tabela no modo `PERMISSIVE` acidentalmente), a query ainda não afeta dados de outros usuários.

---

## 8. Revalidação de Cache

```typescript
import { refresh } from "next/cache";

// Após qualquer mutation bem-sucedida:
refresh();
return { success: true };
```

`refresh()` invalida o cache do Server Component responsável pela página atual, forçando um novo fetch dos dados. Em Next.js App Router, isso propaga automaticamente para todos os Server Components na rota.

**Regras:**
- Chamar `refresh()` apenas em caso de sucesso (nunca em caso de erro)
- `refresh()` é chamado antes do `return { success: true }`
- Não chamar `revalidatePath` ou `revalidateTag` — `refresh()` é suficiente para o padrão atual

---

## 9. Helpers Internos

Funções auxiliares dentro do arquivo de actions são privadas (não exportadas):

```typescript
// ✅ Privado — não exportado
async function getUserTimezone(userId: string): Promise<string> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", userId)
    .single();
  return data?.timezone ?? DEFAULT_TIMEZONE;
}

// ✅ Privado — verificação de ownership de recurso relacionado
async function assertMedicationOwnership(
  medicationId: string,
  userId: string,
): Promise<boolean> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("medications")
    .select("id")
    .eq("id", medicationId)
    .eq("user_id", userId)
    .single();
  return data !== null;
}
```

---

## 10. Exemplos Reais

### createMedicationAction

```typescript
export async function createMedicationAction(
  data: MedicationFormData,
): Promise<ErrorResult | SuccessResult> {
  const parsed = medicationSchema.safeParse(data);
  if (!parsed.success) return { error: "Dados inválidos." };

  const supabase = await createServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { error: "Sessão expirada. Faça login novamente." };

  try {
    const { error } = await supabase.from("medications").insert({
      user_id: user.id,
      name: parsed.data.name,
      dosage: parsed.data.dosage ?? null,
      frequency: parsed.data.frequency ?? null,
      start_date: parsed.data.start_date ?? null,
      active: parsed.data.active,
      notes: parsed.data.notes ?? null,
    });
    if (error) return { error: "Não foi possível salvar. Tente novamente." };
  } catch {
    return { error: "Não foi possível salvar. Tente novamente." };
  }

  refresh();
  return { success: true };
}
```

### deleteReminderAction

```typescript
export async function deleteReminderAction(
  id: string,
): Promise<ErrorResult | SuccessResult> {
  const supabase = await createServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { error: "Sessão expirada. Faça login novamente." };

  try {
    const { error } = await supabase
      .from("reminders")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return { error: "Não foi possível remover. Tente novamente." };
  } catch {
    return { error: "Não foi possível remover. Tente novamente." };
  }

  refresh();
  return { success: true };
}
```

---

## 11. Anti-patterns Proibidos

```typescript
// ❌ PROIBIDO: receber user_id como parâmetro
export async function createLog(userId: string, data: LogData) { ... }

// ❌ PROIBIDO: usar getSession em vez de getUser
const { data: { session } } = await supabase.auth.getSession();
const userId = session?.user?.id; // ← pode estar stale

// ❌ PROIBIDO: não tratar erros de banco
const { data } = await supabase.from("reminders").insert(payload);
// sem verificar error

// ❌ PROIBIDO: não chamar refresh() após mutation
await supabase.from("medications").insert(payload);
return { success: true }; // sem refresh() — UI não atualiza

// ❌ PROIBIDO: lançar exceções não capturadas
export async function deleteReminder(id: string) {
  const supabase = await createServerClient();
  await supabase.from("reminders").delete().eq("id", id); // pode lançar
  return { success: true };
}

// ❌ PROIBIDO: validar com parse (lança exceção)
const data = schema.parse(formData); // lança ZodError — não tratar

// ❌ PROIBIDO: retornar dados do banco no SuccessResult
return { success: true, data: newReminder }; // cliente recarrega via refresh()
```
