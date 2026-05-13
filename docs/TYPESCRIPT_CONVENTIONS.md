# TYPESCRIPT CONVENTIONS — VivaLeve
> **Status:** Oficial. Padrões obrigatórios de TypeScript no projeto.
> **Última revisão:** 2026-05-13
> **Escopo:** Types, Zod schemas, React Hook Form, Supabase client types.

---

## 1. Filosofia

### Inferência sobre declaração manual

Preferir inferência de tipos sobre declarações manuais. O TypeScript é inteligente o suficiente; declarar tipos manualmente onde a inferência funciona é ruído.

```typescript
// ✅ CORRETO — inferência via z.infer
export type ReminderFormData = z.infer<typeof reminderFormSchema>;

// ❌ DESNECESSÁRIO — declaração manual redundante
export type ReminderFormData = {
  medication_id: string;
  time_local: string;
  recurrence: "daily" | "weekdays";
  active: boolean;
};
```

### Zero `any` explícito

Nunca usar `any` explícito. Quando o tipo for genuinamente desconhecido, usar `unknown` e narrowing.

```typescript
// ✅ CORRETO
} catch (error: unknown) {
  if (error instanceof Error) { ... }
}

// ✅ CORRETO — genérico do zodResolver
useForm<ReminderFormInput, unknown, ReminderFormData>

// ❌ PROIBIDO
} catch (error: any) { ... }
const data: any = await fetch(...)
```

---

## 2. Tipos de Banco de Dados

### Fonte de Verdade

`src/types/database.ts` é a fonte de verdade para o schema do banco. Todo tipo derivado de tabela deve partir deste arquivo.

Este arquivo é mantido manualmente e sincronizado com as migrations. No futuro, pode ser gerado via `npx supabase gen types typescript`.

### Estrutura obrigatória de cada tabela

```typescript
TableName: {
  Row: { /* todos os campos com tipos exatos */ };
  Insert: { /* campos obrigatórios no Insert; opcionais com '?' */ };
  Update: { /* todos opcionais com '?' */ };
  Relationships: [ /* array de FK descriptions, ou [] se nenhuma */ ];
};
```

**Regras críticas para o Supabase client TypeScript:**

1. `Views`, `Functions`, `Enums`, `CompositeTypes` vazios devem usar `{ [_ in never]: never }`, **nunca** `Record<string, never>` ou `{}`

```typescript
// ✅ CORRETO
Views: { [_ in never]: never };
Functions: { [_ in never]: never };
Enums: { [_ in never]: never };
CompositeTypes: { [_ in never]: never };

// ❌ CAUSA ERRO — `Record<string, never>` quebra inferência do client
Views: Record<string, never>;
```

**Por quê:** `Record<string, never>` faz qualquer acesso de propriedade retornar `never`, o que quebra a inferência de tipos do Supabase client para as tabelas.

2. `Relationships: []` é obrigatório em cada tabela (mesmo sem FKs)

```typescript
// ✅ CORRETO — sem FKs
profiles: {
  Row: { ... };
  Insert: { ... };
  Update: { ... };
  Relationships: [];  // ← obrigatório mesmo vazio
};
```

### Re-exports em `src/types/app.ts`

```typescript
// Tipos derivados diretamente do Database type
export type Medication = Database["public"]["Tables"]["medications"]["Row"];
export type MedicationInsert = Database["public"]["Tables"]["medications"]["Insert"];
export type MedicationUpdate = Database["public"]["Tables"]["medications"]["Update"];

// Tipos compostos (join na aplicação)
export type ReminderWithMedication = Reminder & {
  medicationName: string;
};
```

**Regra:** importar tipos de domínio de `@/types/app`, nunca diretamente de `@/types/database`.

---

## 3. Zod Schemas e React Hook Form

### O Problema

`zodResolver` do `@hookform/resolvers/zod` usa o tipo do schema como `TFieldValues` (tipo dos campos do formulário). Quando um Zod schema tem transforms que mudam os tipos, o TypeScript pode inferir incorretamente o tipo dos campos.

### Caso 1: transforms opcionais

Quando um campo usa `.optional().transform()`, o tipo de input (`string | undefined`) é diferente do tipo de output (`string | undefined` sem vazio).

```typescript
function optionalText(max: number) {
  return z.string().max(max).optional().transform((v) => v || undefined);
}
// Input:  string | undefined  (o formulário pode enviar string vazia)
// Output: string | undefined  (string vazia é normalizada para undefined)
```

### Caso 2: `.default(value)`

Quando um campo usa `.default(true)`, o tipo de input é `T | undefined` (o formulário pode não enviar) mas o output é sempre `T`.

```typescript
active: z.boolean().default(true)
// Input:  boolean | undefined
// Output: boolean
```

### Solução: `z.input` + três genéricos

Para qualquer schema com transforms ou defaults, exportar dois tipos e usar o padrão de três genéricos no `useForm`:

```typescript
// schemas.ts
export type MedicationFormInput = z.input<typeof medicationSchema>;   // tipo do formulário
export type MedicationFormData  = z.infer<typeof medicationSchema>;   // tipo após transforms

// componente
const { register, handleSubmit } = useForm<
  MedicationFormInput,  // TFieldValues  — shape dos campos no formulário
  unknown,              // TContext       — não usado
  MedicationFormData    // TTransformedValues — shape recebido pelo onSubmit
>({
  resolver: zodResolver(medicationSchema),
  defaultValues: { ... },
});
```

**Regra:** Sempre que o schema tiver `.default()`, `.transform()`, `.pipe()`, ou `.optional()` que altere o tipo, usar o padrão de três genéricos.

### Quando NÃO usar três genéricos

Se o schema não tem transforms que mudam tipos (todos os campos são `z.string()`, `z.number()`, `z.boolean()` sem transforms), `useForm<FormData>` com um único genérico é suficiente.

### Por que não usar `z.preprocess`

`z.preprocess(fn, schema)` tem input type `unknown` — a função preprocessadora recebe `unknown`. Isso quebra a inferência do `zodResolver`:

```typescript
// ❌ EVITAR — input type vira `unknown`, quebra Resolver
dosage: z.preprocess(
  (v) => v === "" ? undefined : v,
  z.string().optional()
)
// TFieldValues.dosage = unknown (não string | undefined)

// ✅ CORRETO — preserva tipo
dosage: z.string().optional().transform((v) => v || undefined)
// TFieldValues.dosage = string | undefined ✓
```

### start_date — padrão com pipe

Para campos que precisam de transformação antes de validação por regex:

```typescript
start_date: z
  .string()
  .optional()                                     // Input: string | undefined
  .transform((v) => (v === "" ? undefined : v))   // Normaliza vazio → undefined
  .pipe(
    z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida")
      .optional()                                  // Output: string | undefined
  ),
```

O `.optional()` **antes** do `.transform()` garante que o input type seja `string | undefined`, não `string` obrigatório.

---

## 4. Tipos de Formulário

### Convenção de nomes

| Sufixo | Tipo | Uso |
|---|---|---|
| `FormInput` | `z.input<schema>` | `TFieldValues` em `useForm` |
| `FormData` | `z.infer<schema>` | `TTransformedValues` em `useForm`, parâmetro de Server Actions |
| `Payload` | schema completo (com campos do servidor) | usado internamente nas Server Actions |

```typescript
export type MedicationFormInput = z.input<typeof medicationSchema>;
export type MedicationFormData  = z.infer<typeof medicationSchema>;

export type ReminderFormInput   = z.input<typeof reminderFormSchema>;
export type ReminderFormData    = z.infer<typeof reminderFormSchema>;
export type ReminderPayload     = z.infer<typeof reminderSchema>; // inclui timezone
```

### defaultValues no useForm

`defaultValues` deve corresponder ao tipo `TFieldValues` (o `FormInput`):

```typescript
useForm<MedicationFormInput, unknown, MedicationFormData>({
  resolver: zodResolver(medicationSchema),
  defaultValues: {
    name: medication?.name ?? "",         // string (não undefined)
    dosage: medication?.dosage ?? "",     // string (input aceita string)
    active: medication?.active ?? true,   // boolean
  },
});
```

**Regra:** campos de texto opcionais têm `defaultValues` como string vazia `""`, não `undefined`. O transform do Zod converte `""` → `undefined` no output.

---

## 5. Pick e tipos parciais de banco

```typescript
// ✅ CORRETO — Pick para queries que retornam colunas específicas
medications: Pick<Medication, "id" | "name" | "active">[]

// ✅ CORRETO — ao adicionar coluna na query, adicionar no Pick
supabase.from("medications").select("id, name, active")
// ↓ tipo correspondente:
Pick<Medication, "id" | "name" | "active">[]
```

**Regra:** O `Pick` na camada de aplicação deve espelhar exatamente as colunas no `select()` do Supabase. Se o select muda, o Pick muda.

---

## 6. Tipos para Supabase client inference

### O problema com tipos vazios

```typescript
// ❌ CAUSA ERRO — Record<string, never> quebra inferência
const { data } = await supabase.from("medications").select("user_id");
// TypeScript: 'user_id' does not exist in type 'never[]'
```

**Causa:** `Record<string, never>` nos campos `Views`, `Functions`, `Enums`, `CompositeTypes` faz o Supabase client inferir `never` para qualquer acesso de propriedade nas tabelas.

**Solução já implementada:** `{ [_ in never]: never }` em todos os campos vazios.

### Verificação rápida de compatibilidade

Se `tsc --noEmit` passar com zero erros E queries como `.select("user_id")` não reclamarem de tipos, a configuração está correta.

---

## 7. Tipos de retorno das Server Actions

```typescript
type ErrorResult  = { error: string };
type SuccessResult = { success: true };

// Em componentes cliente — narrowing correto:
const result = await action(data);

if ("error" in result) {
  // TypeScript sabe: result.error é string
  setErrorMessage(result.error);
} else {
  // TypeScript sabe: result.success é true
  handleSuccess();
}
```

**Regra:** Sempre usar `"error" in result` para narrowing (não `result.success === true`). Mais robusto contra variações futuras do tipo.

---

## 8. Enums como `as const`

```typescript
// ✅ CORRETO — as const para z.enum
recurrence: z.enum(["daily", "weekdays"] as const, {
  message: "Frequência inválida",
})

// ✅ CORRETO — para arrays de opções
export const RECURRENCE_OPTIONS = [
  { value: "daily",    label: "Todos os dias" },
  { value: "weekdays", label: "Dias úteis (seg–sex)" },
] as const;

export type RecurrenceValue = (typeof RECURRENCE_OPTIONS)[number]["value"];
// → "daily" | "weekdays"
```

**Regra:** Arrays de valores literais usam `as const` para que TypeScript infira o tipo literal em vez de `string[]`.

---

## 9. Evitando Erros Comuns

### Erro: `Type 'undefined' is not assignable to type 'boolean'`

**Causa:** Schema com `z.boolean().default(true)` tem input type `boolean | undefined`. Usar `useForm<FormData>` faz o resolver esperar `boolean` não-opcional.

**Fix:** Usar `z.boolean()` sem `.default()` quando o formulário sempre envia o campo (ex: checkbox registrado via `register`), OU usar o padrão de três genéricos.

### Erro: `'property' does not exist in type 'never[]'`

**Causa:** `Record<string, never>` ou `{}` nos campos vazios do Database type.

**Fix:** Substituir por `{ [_ in never]: never }`.

### Erro: `Resolver<{...input...}, any, {...output...}>` não é assignable

**Causa:** Mismatch entre o tipo do schema passado ao `zodResolver` e o `TFieldValues` do `useForm`.

**Fix:** Usar `useForm<FormInput, unknown, FormData>` onde `FormInput = z.input<schema>` e `FormData = z.infer<schema>`.

### Erro: campos opcionais com input `unknown`

**Causa:** uso de `z.preprocess(fn, schema)`.

**Fix:** substituir por `.optional().transform()` ou `.optional().transform().pipe()`.

---

## 10. Tabela de Referência Rápida

| Situação | Solução |
|---|---|
| Campo opcional de texto no form | `z.string().optional().transform(v => v \|\| undefined)` |
| Campo opcional com validação após transform | `.optional().transform(...).pipe(z.string().regex(...).optional())` |
| Boolean sempre enviado pelo form | `z.boolean()` (sem `.default()`) |
| Boolean com valor padrão server-side | `z.boolean().default(true)` + padrão de três genéricos |
| useForm com transforms | `useForm<FormInput, unknown, FormData>` |
| Tipos de tabela do Supabase | `z.input<schema>` para Input, `z.infer<schema>` para Output |
| Campos vazios no Database type | `{ [_ in never]: never }` |
| Narrowing de resultado de Server Action | `"error" in result` |
| Enums literais | `["a", "b"] as const` |
| Arrays de opções tipadas | `as const` + `(typeof arr)[number]["value"]` |
