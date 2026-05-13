import type { Metadata } from "next";
import { RegisterForm } from "@/features/auth/components/RegisterForm";

export const metadata: Metadata = {
  title: "Criar conta",
};

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Criar conta</h1>
        <p className="text-sm text-muted-foreground">
          Comece a acompanhar sua saúde
        </p>
      </div>

      <RegisterForm />
    </div>
  );
}
