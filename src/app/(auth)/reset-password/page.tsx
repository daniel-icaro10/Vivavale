import type { Metadata } from "next";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Recuperar senha",
};

export default function ResetPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold text-foreground">
          Recuperar senha
        </h1>
        <p className="text-sm text-muted-foreground">
          Enviaremos um link para o seu e-mail
        </p>
      </div>

      <ResetPasswordForm />
    </div>
  );
}
