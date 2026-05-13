"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePasswordAction } from "../actions";
import { updatePasswordSchema, type UpdatePasswordFormData } from "../schemas";

export function UpdatePasswordForm() {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePasswordFormData>({
    resolver: zodResolver(updatePasswordSchema),
  });

  const onSubmit = async (data: UpdatePasswordFormData) => {
    const result = await updatePasswordAction(data);
    if (result?.error) {
      setError("root", { message: result.error });
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="space-y-5"
    >
      <div className="space-y-1.5">
        <Label htmlFor="password">Nova senha</Label>
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
        {isSubmitting ? "Salvando..." : "Salvar nova senha"}
      </Button>
    </form>
  );
}
