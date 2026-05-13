"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerAction } from "../actions";
import { registerSchema, type RegisterFormData } from "../schemas";

export function RegisterForm() {
  const [confirmed, setConfirmed] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    const result = await registerAction(data);
    if ("needsConfirmation" in result) {
      setConfirmed(true);
      return;
    }
    if ("error" in result) {
      setError("root", { message: result.error });
    }
  };

  if (confirmed) {
    return (
      <div role="status" className="space-y-4 text-center">
        <p className="text-base font-medium text-foreground">
          Verifique seu e-mail
        </p>
        <p className="text-sm text-muted-foreground">
          Enviamos um link de confirmação. Acesse sua caixa de entrada e clique
          no link para ativar sua conta.
        </p>
        <Link
          href="/login"
          className="block text-sm text-primary hover:underline"
        >
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="space-y-5"
    >
      <div className="space-y-1.5">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          type="text"
          autoComplete="name"
          placeholder="Como você se chama?"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "name-error" : undefined}
          {...register("name")}
        />
        {errors.name && (
          <p id="name-error" role="alert" className="text-xs text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="seu@email.com"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
        {errors.email && (
          <p id="email-error" role="alert" className="text-xs text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          aria-describedby={`password-hint${errors.password ? " password-error" : ""}`}
          {...register("password")}
        />
        <p id="password-hint" className="text-xs text-muted-foreground">
          Mínimo de 8 caracteres
        </p>
        {errors.password && (
          <p
            id="password-error"
            role="alert"
            className="text-xs text-destructive"
          >
            {errors.password.message}
          </p>
        )}
      </div>

      {errors.root && (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
        >
          {errors.root.message}
        </p>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-11 w-full"
      >
        {isSubmitting ? "Criando conta..." : "Criar conta"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
