"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { env } from "@/lib/env";
import {
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updatePasswordSchema,
  type LoginFormData,
  type RegisterFormData,
  type ResetPasswordFormData,
  type UpdatePasswordFormData,
} from "./schemas";

type ErrorResult = { error: string };
type SuccessResult = { success: true };
type ConfirmationResult = { needsConfirmation: true };

const AUTH_ERRORS: Record<string, string> = {
  "Invalid login credentials": "E-mail ou senha incorretos.",
  "Email not confirmed": "Confirme seu e-mail antes de entrar.",
  "User already registered": "Esse e-mail já está cadastrado.",
  "Email rate limit exceeded": "Muitas tentativas. Aguarde alguns minutos.",
  "Password should be at least 6 characters":
    "A senha deve ter pelo menos 8 caracteres.",
  "New password should be different from the old password":
    "A nova senha deve ser diferente da senha atual.",
  "Signup is disabled": "O cadastro está temporariamente indisponível.",
  "Email link is invalid or has expired":
    "O link expirou. Solicite um novo.",
  "Token has expired or is invalid":
    "O link expirou. Solicite um novo.",
  "Auth session missing!":
    "Sessão expirada. Solicite um novo link de recuperação.",
};

function mapAuthError(message: string): string {
  return AUTH_ERRORS[message] ?? "Algo deu errado. Tente novamente.";
}

export async function loginAction(
  data: LoginFormData,
): Promise<ErrorResult | undefined> {
  const parsed = loginSchema.safeParse(data);
  if (!parsed.success) return { error: "Dados inválidos." };

  const allowed = await checkRateLimit("login", parsed.data.email);
  if (!allowed) return { error: "Muitas tentativas. Aguarde alguns minutos." };

  const supabase = await createServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) return { error: mapAuthError(error.message) };

  redirect("/dashboard");
}

export async function registerAction(
  data: RegisterFormData,
): Promise<ErrorResult | ConfirmationResult> {
  const parsed = registerSchema.safeParse(data);
  if (!parsed.success) return { error: "Dados inválidos." };

  const allowed = await checkRateLimit("register", parsed.data.email);
  if (!allowed) return { error: "Muitas tentativas. Aguarde alguns minutos." };

  const supabase = await createServerClient();
  const { data: authData, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { name: parsed.data.name },
    },
  });

  if (error) return { error: mapAuthError(error.message) };

  // session null = confirmação de e-mail obrigatória (ou e-mail já cadastrado —
  // Supabase não distingue os dois para prevenir enumeração de e-mails).
  if (!authData.session) {
    return { needsConfirmation: true };
  }

  redirect("/dashboard");
}

export async function resetPasswordAction(
  data: ResetPasswordFormData,
): Promise<ErrorResult | SuccessResult> {
  const parsed = resetPasswordSchema.safeParse(data);
  if (!parsed.success) return { error: "E-mail inválido." };

  const allowed = await checkRateLimit("reset_password", parsed.data.email);
  if (!allowed) return { error: "Muitas tentativas. Aguarde alguns minutos." };

  const supabase = await createServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    { redirectTo: `${env.siteUrl}/auth/callback` },
  );

  if (error) return { error: mapAuthError(error.message) };

  return { success: true };
}

export async function updatePasswordAction(
  data: UpdatePasswordFormData,
): Promise<ErrorResult | undefined> {
  const parsed = updatePasswordSchema.safeParse(data);
  if (!parsed.success) return { error: "Dados inválidos." };

  const supabase = await createServerClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) return { error: mapAuthError(error.message) };

  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
