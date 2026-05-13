import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/components/LoginForm";

export const metadata: Metadata = {
  title: "Entrar",
};

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold text-foreground">VivaLeve</h1>
        <p className="text-sm text-muted-foreground">
          Entre na sua conta para continuar
        </p>
      </div>

      <LoginForm />
    </div>
  );
}
