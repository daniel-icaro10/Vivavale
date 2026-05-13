import type { Metadata } from "next";
import { UpdatePasswordForm } from "@/features/auth/components/UpdatePasswordForm";

export const metadata: Metadata = {
  title: "Nova senha",
};

export default function UpdatePasswordPage() {
  return (
    <>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">
        Criar nova senha
      </h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Escolha uma senha segura para sua conta.
      </p>
      <UpdatePasswordForm />
    </>
  );
}
