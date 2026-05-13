import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Informe seu e-mail")
    .trim()
    .toLowerCase()
    .email("E-mail inválido"),
  password: z
    .string()
    .min(1, "Informe sua senha"),
});

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe seu nome completo"),
  email: z
    .string()
    .min(1, "Informe seu e-mail")
    .trim()
    .toLowerCase()
    .email("E-mail inválido"),
  password: z
    .string()
    .min(8, "A senha deve ter pelo menos 8 caracteres"),
});

export const resetPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Informe seu e-mail")
    .trim()
    .toLowerCase()
    .email("E-mail inválido"),
});

export const updatePasswordSchema = z.object({
  password: z
    .string()
    .min(8, "A nova senha deve ter pelo menos 8 caracteres"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;
