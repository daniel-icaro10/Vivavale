import { z } from "zod";
import { PROFILE_NAME_MAX, TIMEZONE_VALUES } from "./constants";

export const profileSchema = z.object({
  // .trim() é um transform, mas não altera o tipo TypeScript (string → string).
  // z.input<schema> === z.infer<schema> aqui — useForm<ProfileFormData> é suficiente.
  name: z
    .string()
    .min(1, "Nome é obrigatório")
    .max(PROFILE_NAME_MAX, "Nome muito longo")
    .trim(),
  timezone: z.enum(TIMEZONE_VALUES, { message: "Fuso horário inválido" }),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
