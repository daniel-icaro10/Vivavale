import { z } from "zod";
import {
  MEDICATION_DOSAGE_MAX,
  MEDICATION_FREQUENCY_MAX,
  MEDICATION_NAME_MAX,
  MEDICATION_NOTES_MAX,
} from "./constants";

// Campos opcionais de texto: aceita string | undefined como input (do formulário)
// e normaliza string vazia para undefined no output.
// Usa .optional().transform() para preservar inferência de tipos no zodResolver
// (z.preprocess recebe `unknown`, quebrando o tipo do Resolver).
function optionalText(max: number) {
  return z
    .string()
    .max(max)
    .optional()
    .transform((v) => v || undefined);
}

export const medicationSchema = z.object({
  name: z
    .string()
    .min(1, "Informe o nome do medicamento")
    .max(MEDICATION_NAME_MAX),
  dosage: optionalText(MEDICATION_DOSAGE_MAX),
  frequency: optionalText(MEDICATION_FREQUENCY_MAX),
  // start_date: string vazia convertida em undefined antes da validação do regex.
  // z.string().optional() aceita `string | undefined` como input — necessário para
  // que o TFieldValues do Resolver seja `string | undefined` (não `string` obrigatório).
  start_date: z
    .string()
    .optional()
    .transform((v) => (v === "" ? undefined : v))
    .pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida").optional()),
  // z.boolean() sem .default(): o formulário sempre envia active via checkbox registrado.
  // .default(true) gerava input type `boolean | undefined`, incompatível com o Resolver.
  active: z.boolean(),
  notes: optionalText(MEDICATION_NOTES_MAX),
});

// Input type: shape do que o formulário envia (usado em useForm<TFieldValues>)
export type MedicationFormInput = z.input<typeof medicationSchema>;

// Output type: shape do que onSubmit recebe após transforms do Zod
export type MedicationFormData = z.infer<typeof medicationSchema>;
